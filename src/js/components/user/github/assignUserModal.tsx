import Button from '@salesforce/design-system-react/components/button';
import Checkbox from '@salesforce/design-system-react/components/checkbox';
import DataTableCell from '@salesforce/design-system-react/components/data-table/cell';
import Modal from '@salesforce/design-system-react/components/modal';
import i18n from 'i18next';
import React, { useCallback, useState } from 'react';
import { Trans } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useDispatch } from 'react-redux';
import { Project } from 'src/js/store/projects/reducer';

import ReSyncGithubUserButton from '~js/components/user/github/reSyncButton';
import {
  GitHubUserButton,
  TableCellProps,
} from '~js/components/user/githubUser';
import { SpinnerWrapper } from '~js/components/utils';
import { ThunkDispatch } from '~js/store';
import { refreshGitHubUsers } from '~js/store/projects/actions';
import { GitHubUser, User } from '~js/store/user/reducer';
import { selectUserState } from '~js/store/user/selectors';
import { ORG_TYPES, OrgTypes } from '~js/utils/constants';

const AssignUserModal = ({
  epicUsers,
  selectedUser,
  orgType,
  isOpen,
  onRequestClose,
  setUser,
  project,
}: {
  epicUsers: GitHubUser[];
  selectedUser: GitHubUser | null;
  orgType: OrgTypes;
  isOpen: boolean;
  onRequestClose: () => void;
  setUser: (user: GitHubUser | null, shouldAlertAssignee: boolean) => void;
  project: Project;
}) => {
  const currentUser = useSelector(selectUserState) as User;
  const dispatch = useDispatch<ThunkDispatch>();
  const [selection, setSelection] = useState<GitHubUser | null>(null);
  const [shouldAlertAssignee, setShouldAlertAssignee] = useState(true);
  const [autoToggle, setAutoToggle] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleAlertAssignee = (
    event: React.FormEvent<HTMLFormElement>,
    { checked }: { checked: boolean },
  ) => {
    setShouldAlertAssignee(checked);
    setAutoToggle(false);
  };
  const handleAssigneeSelection = (user: GitHubUser) => {
    const currentUserSelected = user.login === currentUser.username;
    setSelection(user);
    if (autoToggle) {
      setShouldAlertAssignee(!currentUserSelected);
    }
  };
  const handleClose = () => {
    onRequestClose();
    setSelection(null);
    setShouldAlertAssignee(true);
    setAutoToggle(true);
  };
  const handleSave = () => {
    if (selection) {
      const selectedAssignee = selection;
      setUser(selectedAssignee, shouldAlertAssignee);
      handleClose();
    }
  };

  const doRefreshGitHubUsers = useCallback(() => {
    /* istanbul ignore if */
    if (!project) {
      return;
    }
    setIsRefreshing(true);
    dispatch(refreshGitHubUsers(project.id)).finally(() =>
      setIsRefreshing(false),
    );
  }, [project, dispatch]);

  const filteredUsers = epicUsers.filter(
    (user) => user.id !== selectedUser?.id,
  );

  const heading =
    orgType === ORG_TYPES.QA
      ? i18n.t('Assign Tester')
      : i18n.t('Assign Developer');
  const checkboxLabel =
    orgType === ORG_TYPES.QA
      ? i18n.t('Notify Assigned Tester by Email')
      : i18n.t('Notify Assigned Developer by Email');
  const alertType =
    orgType === ORG_TYPES.DEV ? 'should_alert_dev' : 'should_alert_qa';

  const githubCollaboratorHeading = filteredUsers.length
    ? i18n.t('Other Github Collaborators')
    : i18n.t('Github Collaborators');

  const UserTableCell = ({
    item,
    handleUserClick,
    ...props
  }: TableCellProps) => {
    /* istanbul ignore if */
    if (!item) {
      return null;
    }
    const { login } = item;
    const handleClick = () => {
      handleUserClick(item);
    };
    return (
      <DataTableCell {...props} title={login}>
        <GitHubUserButton
          withName
          user={item}
          onClick={handleClick}
          className="slds-p-left_medium"
        />
      </DataTableCell>
    );
  };
  UserTableCell.displayName = DataTableCell.displayName;
  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={handleClose}
      heading={heading}
      directional
      size="small"
      footer={[
        <Checkbox
          key="alert"
          labels={{ label: checkboxLabel }}
          className="slds-float_left slds-p-top_xx-small"
          name={alertType}
          checked={shouldAlertAssignee}
          onChange={handleAlertAssignee}
        />,
        <Button key="cancel" label={i18n.t('Cancel')} onClick={handleClose} />,
        <Button
          key="submit"
          label={i18n.t('Save')}
          variant="brand"
          onClick={handleSave}
        />,
      ]}
    >
      <div
        className="slds-grid
          slds-grid_vertical-align-start
          slds-p-top_medium
          slds-p-horizontal_medium"
      >
        <div className="slds-grid slds-wrap slds-shrink slds-p-right_medium">
          <p>
            <Trans i18nKey="assignUserHelper">
              Assign any Github user to this role. If they are not already, the
              will also be added as an Epic Collaborator.
            </Trans>
          </p>
        </div>
        <div
          className="slds-grid
            slds-grow
            slds-shrink-none
            slds-grid_align-end"
        >
          <ReSyncGithubUserButton
            isRefreshing={isRefreshing}
            refreshUsers={doRefreshGitHubUsers}
          />
        </div>
      </div>
      <div className="slds-is-relative">
        <div className="slds-p-horizontal_medium slds-p-top_medium">
          <input type="text" placeholder="Quick Find" />
        </div>
        {selectedUser && (
          <div className="slds-p-around_small slds-p-bottom_none">
            <div className="slds-text-title slds-m-bottom_xx-small">
              {i18n.t('Currently Assigned')}
            </div>
            <GitHubUserButton withName user={selectedUser} isAssigned />
          </div>
        )}
        {filteredUsers.length ? (
          <div className="slds-p-around_small slds-p-bottom_none">
            <div className="slds-text-title slds-m-bottom_xx-small">
              {i18n.t('Epic Collaborators')}
            </div>
            <ul>
              {filteredUsers.map((user) => (
                <li key={user.id}>
                  <GitHubUserButton
                    withName
                    user={user}
                    isSelected={selection === user}
                    onClick={() => handleAssigneeSelection(user)}
                  />
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="slds-p-horizontal_medium slds-p-top_medium">
            <Trans i18nKey="noEpicCollaborators">
              There are no Epic Collaborators. Select GitHub users to add as
              Collaborators
            </Trans>
          </div>
        )}
        <div className="slds-p-around_small">
          <div className="slds-text-title slds-m-bottom_xx-small">
            {githubCollaboratorHeading}
          </div>
          <ul>
            {project.github_users.map((user) => (
              <li key={user.id}>
                <GitHubUserButton
                  withName
                  user={user}
                  isSelected={selection === user}
                  onClick={() => handleAssigneeSelection(user)}
                />
              </li>
            ))}
          </ul>
        </div>
        {isRefreshing && <SpinnerWrapper />}
      </div>
    </Modal>
  );
};

export default AssignUserModal;
