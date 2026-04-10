import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Document, DocumentRecord } from '../events/schemas/document.schema';

@Injectable()
export class ReportsService {
  constructor(
    @InjectModel(Document.name)
    private documentModel: Model<DocumentRecord>,
  ) {}

  async getSummary() {
    const [result] = await this.documentModel.aggregate([
      {
        $facet: {
          statusDistribution: this.statusPipeline(),
          documentTypeBreakdown: this.typePipeline(),
        },
      },
    ]);

    return {
      statusDistribution: result?.statusDistribution ?? [],
      documentTypeBreakdown: result?.documentTypeBreakdown ?? [],
    };
  }

  private statusPipeline() {
    return [
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $project: { _id: 0, status: '$_id', count: 1 } },
      { $sort: { status: 1 as const } },
    ];
  }

  private typePipeline() {
    return [
      { $group: { _id: '$documentType', count: { $sum: 1 } } },
      {
        $group: {
          _id: null,
          types: { $push: { documentType: '$_id', count: '$count' } },
          total: { $sum: '$count' },
        },
      },
      { $unwind: '$types' },
      {
        $project: {
          _id: 0,
          documentType: '$types.documentType',
          count: '$types.count',
          percentage: {
            $round: [
              { $multiply: [{ $divide: ['$types.count', '$total'] }, 100] },
              2,
            ],
          },
        },
      },
      { $sort: { documentType: 1 as const } },
    ];
  }
}
