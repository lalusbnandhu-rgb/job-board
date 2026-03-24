import { Company } from '../models/company.model';
import { Job } from '../models/job.model';
import { ApiError } from '../utils/errors';
import { parsePagination, buildPaginationMeta } from '../utils/pagination';

export const listCompanies = async (
  rawPage?: string,
  rawLimit?: string,
  search?: string,
) => {
  const { page, limit, skip } = parsePagination(rawPage, rawLimit);

  const matchStage = search
    ? { name: { $regex: search, $options: 'i' } }
    : {};

  const [companies, total] = await Promise.all([
    Company.aggregate([
      { $match: matchStage },
      {
        $lookup: {
          from: 'jobs',
          let: { cid: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$companyId', '$$cid'] },
                    { $eq: ['$status', 'active'] },
                  ],
                },
              },
            },
          ],
          as: 'activeJobs',
        },
      },
      { $addFields: { activeJobCount: { $size: '$activeJobs' } } },
      { $project: { activeJobs: 0, logoPublicId: 0 } },
      { $sort: { name: 1 } },
      { $skip: skip },
      { $limit: limit },
    ]),
    Company.countDocuments(matchStage),
  ]);

  return { companies, pagination: buildPaginationMeta(total, page, limit) };
};

export const getCompanyBySlug = async (slug: string) => {
  const company = await Company.findOne({ slug }).lean();
  if (!company) throw new ApiError(404, 'Company not found');

  const jobs = await Job.find({ companyId: company._id, status: 'active' })
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();

  return { company, jobs };
};
