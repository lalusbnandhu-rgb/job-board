'use client';

import Image from 'next/image';
import { User, FileText, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ApplicationStatusBadge } from '@/components/seeker/application-status-badge';
import { ApplicationStatusSelect } from './application-status-select';
import type { EmployerApplication } from '@/types/employer';
import type { ApplicationStatus } from '@/types/seeker';

interface ApplicantCardProps {
  application: EmployerApplication;
  onStatusChange: (applicationId: string, status: ApplicationStatus) => void;
  isUpdating?: boolean;
}

export function ApplicantCard({ application, onStatusChange, isUpdating }: ApplicantCardProps) {
  const { seekerProfile } = application;
  const seekerEmail =
    typeof application.seekerId === 'object' ? application.seekerId.email : null;

  const fullName = seekerProfile
    ? `${seekerProfile.firstName} ${seekerProfile.lastName}`
    : seekerEmail ?? 'Unknown applicant';

  const appliedDate = new Date(application.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          {/* Applicant info */}
          <div className="flex items-center gap-3">
            {seekerProfile?.avatar ? (
              <Image
                src={seekerProfile.avatar}
                alt={fullName}
                width={40}
                height={40}
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                <User className="h-5 w-5 text-gray-400" />
              </div>
            )}
            <div>
              <p className="font-medium text-gray-900">{fullName}</p>
              {seekerProfile?.headline && (
                <p className="text-sm text-gray-500">{seekerProfile.headline}</p>
              )}
              {seekerEmail && (
                <p className="text-xs text-gray-400">{seekerEmail}</p>
              )}
            </div>
          </div>

          {/* Status + date */}
          <div className="flex flex-col items-end gap-2 shrink-0">
            <ApplicationStatusBadge status={application.status} />
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <Calendar className="h-3 w-3" />
              {appliedDate}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Cover letter snippet */}
        <div>
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-400">
            Cover Letter
          </p>
          <p className="line-clamp-3 text-sm text-gray-700">{application.coverLetter}</p>
        </div>

        {/* Employer note */}
        {application.employerNote && (
          <div className="rounded-md bg-amber-50 px-3 py-2">
            <p className="text-xs font-medium text-amber-700">Your note</p>
            <p className="text-sm text-amber-800">{application.employerNote}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-1">
          {/* Resume link */}
          <a
            href={application.resumeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:underline"
          >
            <FileText className="h-4 w-4" />
            View Resume
          </a>

          {/* Status change */}
          <ApplicationStatusSelect
            value={application.status}
            onValueChange={(status) => onStatusChange(application._id, status)}
            disabled={isUpdating}
          />
        </div>
      </CardContent>
    </Card>
  );
}
