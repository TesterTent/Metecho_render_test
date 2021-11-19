import Icon from '@salesforce/design-system-react/components/icon';
import ProgressRing from '@salesforce/design-system-react/components/progress-ring';
import i18n from 'i18next';
import React from 'react';

import {
  REVIEW_STATUSES,
  ReviewStatuses,
  TASK_STATUSES,
  TaskStatuses,
} from '@/js/utils/constants';

const getTaskStatus = ({
  taskStatus,
  reviewStatus,
  reviewValid,
  prIsOpen,
}: {
  taskStatus: TaskStatuses;
  reviewStatus: ReviewStatuses | '';
  reviewValid: boolean;
  prIsOpen: boolean;
}) => {
  let displayStatus, icon;
  const status =
    reviewValid && reviewStatus && taskStatus === TASK_STATUSES.IN_PROGRESS
      ? reviewStatus
      : taskStatus;
  switch (status) {
    case TASK_STATUSES.PLANNED:
      displayStatus = i18n.t('Planned');
      icon = <ProgressRing value={0} />;
      break;
    case TASK_STATUSES.IN_PROGRESS:
      if (prIsOpen) {
        displayStatus = i18n.t('Test');
        icon = <ProgressRing value={60} flowDirection="fill" theme="active" />;
      } else {
        displayStatus = i18n.t('In Progress');
        icon = <ProgressRing value={40} flowDirection="fill" theme="active" />;
      }
      break;
    case TASK_STATUSES.COMPLETED:
      displayStatus = i18n.t('Complete');
      icon = <ProgressRing value={100} theme="complete" hasIcon />;
      break;
    case TASK_STATUSES.CANCELED:
      displayStatus = i18n.t('Canceled');
      icon = (
        <ProgressRing
          value={0}
          hasIcon
          icon={<Icon category="utility" name="close" />}
        />
      );
      break;
    case REVIEW_STATUSES.CHANGES_REQUESTED:
      displayStatus = i18n.t('Changes Requested');
      icon = (
        <ProgressRing value={60} flowDirection="fill" theme="warning" hasIcon />
      );
      break;
    case REVIEW_STATUSES.APPROVED:
      displayStatus = i18n.t('Approved');
      icon = <ProgressRing value={80} flowDirection="fill" />;
      break;
  }

  return {
    status: displayStatus || status,
    icon,
  };
};

export default getTaskStatus;
