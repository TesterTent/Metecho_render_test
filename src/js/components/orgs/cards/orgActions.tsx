import Button from '@salesforce/design-system-react/components/button';
import Dropdown from '@salesforce/design-system-react/components/menu-dropdown';
import i18n from 'i18next';
import React from 'react';
import { Trans } from 'react-i18next';

import TourPopover from '~js/components/tour/popover';
import { LabelWithSpinner } from '~js/components/utils';
import { Org } from '~js/store/orgs/reducer';
import { Task } from '~js/store/tasks/reducer';
import { ORG_TYPES, OrgTypes, REVIEW_STATUSES } from '~js/utils/constants';

const OrgActions = ({
  org,
  type,
  task,
  disableCreation,
  ownedByCurrentUser,
  assignedToCurrentUser,
  ownedByWrongUser,
  orgOutOfDate,
  readyForReview,
  userHasPermissions,
  isCreating,
  isDeleting,
  isRefreshingOrg,
  isSubmittingReview,
  openSubmitReviewModal,
  doCreateOrg,
  doDeleteOrg,
  doRefreshOrg,
}: {
  org: Org | null;
  type: OrgTypes;
  task?: Task;
  disableCreation: boolean;
  ownedByCurrentUser: boolean;
  assignedToCurrentUser?: boolean;
  ownedByWrongUser?: Org | null;
  orgOutOfDate?: boolean;
  readyForReview?: boolean;
  userHasPermissions?: boolean;
  isCreating: boolean;
  isDeleting: boolean;
  isRefreshingOrg?: boolean;
  isSubmittingReview?: boolean;
  openSubmitReviewModal?: () => void;
  doCreateOrg?: () => void;
  doDeleteOrg: () => void;
  doRefreshOrg?: () => void;
}) => {
  if (isCreating) {
    return (
      <Button
        label={<LabelWithSpinner label={i18n.t('Creating Org…')} />}
        disabled
      />
    );
  }

  if (isRefreshingOrg) {
    return (
      <Button
        label={<LabelWithSpinner label={i18n.t('Refreshing Org…')} />}
        disabled
      />
    );
  }

  if (isSubmittingReview) {
    return (
      <Button
        label={<LabelWithSpinner label={i18n.t('Submitting Review…')} />}
        disabled
      />
    );
  }

  if (isDeleting) {
    return null;
  }

  let submitReviewBtn = null;

  if (readyForReview && userHasPermissions) {
    if (task?.review_valid) {
      submitReviewBtn = (
        <Button
          label={i18n.t('Update Review')}
          variant="outline-brand"
          className="slds-m-right_x-small"
          onClick={openSubmitReviewModal}
        />
      );
    } else if (org?.has_been_visited) {
      submitReviewBtn = (
        <Button
          label={i18n.t('Submit Review')}
          variant="outline-brand"
          className="slds-m-right_x-small"
          onClick={openSubmitReviewModal}
        />
      );
    }
  }

  if (ownedByCurrentUser && (org || ownedByWrongUser)) {
    return (
      <>
        {orgOutOfDate && doRefreshOrg ? (
          <Button
            label={i18n.t('Refresh Org')}
            variant="brand"
            className="slds-m-horizontal_x-small"
            onClick={doRefreshOrg}
          />
        ) : null}
        {submitReviewBtn}
        <Dropdown
          align="right"
          assistiveText={{ icon: i18n.t('Org Actions') }}
          buttonClassName="slds-button_icon-x-small"
          buttonVariant="icon"
          iconCategory="utility"
          iconName="down"
          iconSize="small"
          iconVariant="border-filled"
          width="xx-small"
          options={[{ id: 0, label: i18n.t('Delete Org') }]}
          onSelect={doDeleteOrg}
        />
      </>
    );
  }

  if (task && assignedToCurrentUser && !(org || ownedByWrongUser)) {
    const preventNewTestOrg =
      type === ORG_TYPES.QA && !task.has_unmerged_commits;
    const hasReviewRejected =
      task.review_valid &&
      task.review_status === REVIEW_STATUSES.CHANGES_REQUESTED;
    const needsReview =
      task.has_unmerged_commits && task.pr_is_open && !task.review_valid;
    let isActive = false;
    let popoverHeading, popoverBody, popoverKey;

    switch (type) {
      case ORG_TYPES.DEV:
        isActive = hasReviewRejected || !task.has_unmerged_commits;
        popoverHeading = i18n.t('Create a Dev Org');
        popoverKey = 'tourTaskCreateDevOrg';
        popoverBody =
          'A Dev Org is a temporary Salesforce org where you can make changes that you would like to contribute to the Project. To create an Org, make sure you are connected to your Salesforce account with a Dev Hub enabled. Use the drop down menu to delete the Org when you no longer need it.';
        break;
      case ORG_TYPES.QA:
        isActive = needsReview;
        popoverHeading = i18n.t('Create a Test Org');
        popoverKey = 'tourTaskCreateTestOrg';
        popoverBody =
          'A Test Org is a temporary Salesforce org where you can view the changes the Developer retrieved. Make sure you are connected to your Salesforce account with a Dev Hub enabled. Read the Developer’s Commit History to see what changes they made. Use the drop down menu to delete the Test Org when you no longer need it.';
        break;
    }
    return (
      <>
        {submitReviewBtn}
        {!(preventNewTestOrg || disableCreation) && (
          <div className="slds-is-relative">
            <Button
              label={i18n.t('Create Org')}
              variant={isActive ? 'brand' : 'neutral'}
              onClick={doCreateOrg}
            />
            <TourPopover
              align="right"
              heading={popoverHeading}
              body={<Trans i18nKey={popoverKey}>{popoverBody}</Trans>}
            />
          </div>
        )}
      </>
    );
  }

  return null;
};

export default OrgActions;
