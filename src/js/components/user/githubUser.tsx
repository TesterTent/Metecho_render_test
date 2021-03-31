import Avatar from '@salesforce/design-system-react/components/avatar';
import Button from '@salesforce/design-system-react/components/button';
import Card from '@salesforce/design-system-react/components/card';
import DataTable from '@salesforce/design-system-react/components/data-table';
import DataTableCell from '@salesforce/design-system-react/components/data-table/cell';
import DataTableColumn from '@salesforce/design-system-react/components/data-table/column';
import Modal from '@salesforce/design-system-react/components/modal';
import classNames from 'classnames';
import i18n from 'i18next';
import React, { useCallback, useEffect, useState } from 'react';
import { Trans } from 'react-i18next';

import { EmptyIllustration } from '~js/components/404';
import ReSyncGithubUserButton from '~js/components/user/github/reSyncButton';
import { SpinnerWrapper } from '~js/components/utils';
import { GitHubUser } from '~js/store/user/reducer';

export interface TableCellProps {
  [key: string]: any;
  item?: GitHubUser;
  handleUserClick: (user: GitHubUser) => void;
}

export const GitHubUserAvatar = ({
  user,
  size,
}: {
  user: GitHubUser;
  size?: string;
}) => (
  <Avatar
    imgAlt={i18n.t('avatar for user {{username}}', { username: user.login })}
    imgSrc={user.avatar_url}
    title={user.login}
    size={size || 'small'}
  />
);
// includes avatar and name (todo change to username && fullname)
export const GitHubUserButton = ({
  user,
  isAssigned,
  isSelected,
  withName,
  ...props
}: {
  user: GitHubUser;
  isAssigned?: boolean;
  isSelected?: boolean;
  withName?: boolean;
  [key: string]: any;
}) => (
  <Button
    className={classNames(
      'slds-size_full',
      'slds-p-around_xx-small',
      'collaborator-button',
      {
        'is-assigned': isAssigned,
        'is-selected': isSelected,
      },
    )}
    title={user.login}
    label={
      <>
        <GitHubUserAvatar user={user} />
        <span className="collaborator-username">{user.login}</span>
        {withName && (
          <span className="collaborator-username">({user.name})</span>
        )}
      </>
    }
    variant="base"
    disabled={isSelected || isAssigned}
    {...props}
  />
);

export const UserCard = ({
  user,
  removeUser,
  className,
}: {
  user: GitHubUser;
  removeUser?: () => void;
  className?: string;
}) => (
  <Card
    className={classNames(className, 'collaborator-card')}
    icon={<GitHubUserAvatar user={user} />}
    heading={user.login}
    headerActions={
      removeUser && (
        <Button
          assistiveText={{ icon: i18n.t('Remove') }}
          iconCategory="utility"
          iconName="close"
          iconSize="small"
          iconVariant="border-filled"
          variant="icon"
          title={i18n.t('Remove')}
          onClick={removeUser}
        />
      )
    }
  />
);

export const UserCards = ({
  users,
  removeUser,
}: {
  users: GitHubUser[];
  removeUser: (user: GitHubUser) => void;
}) => (
  <div
    className="slds-grid
      slds-wrap
      slds-grid_pull-padded-xx-small
      slds-m-top_large"
  >
    {users.map((user) => {
      const doRemoveUser = () => removeUser(user);
      return (
        <div
          key={user.id}
          className="slds-size_1-of-1
            slds-large-size_1-of-2
            slds-p-around_xx-small"
        >
          <UserCard user={user} removeUser={doRemoveUser} />
        </div>
      );
    })}
  </div>
);

const UserTableCell = ({ item, handleUserClick, ...props }: TableCellProps) => {
  /* istanbul ignore if */
  if (!item) {
    return null;
  }
  const { login } = item;
  const handleClick = () => {
    handleUserClick(item);
  };
  return (
    <DataTableCell {...props} title={login} className="slds-p-around_none">
      <GitHubUserButton user={item} onClick={handleClick} />
    </DataTableCell>
  );
};
UserTableCell.displayName = DataTableCell.displayName;

// has allUsers with avatar, login, & login
export const AssignUsersModal = ({
  allUsers,
  selectedUsers,
  heading,
  isOpen,
  onRequestClose,
  setUsers,
  isRefreshing,
  refreshUsers,
}: {
  allUsers: GitHubUser[];
  selectedUsers: GitHubUser[];
  heading: string;
  isOpen: boolean;
  onRequestClose: () => void;
  setUsers: (users: GitHubUser[]) => void;
  isRefreshing: boolean;
  refreshUsers: () => void;
}) => {
  const [selection, setSelection] = useState(selectedUsers);
  const reset = useCallback(() => setSelection(selectedUsers), [selectedUsers]);

  // When selected users change, update row selection
  useEffect(() => {
    reset();
  }, [reset]);

  const handleUserClick = useCallback(
    (user: GitHubUser) => {
      const isSelected = selection.findIndex((u) => u.id === user.id) > -1;
      if (isSelected) {
        setSelection(selection.filter((u) => u.id !== user.id));
      } else {
        setSelection([...selection, user]);
      }
    },
    [selection],
  );

  // When modal is canceled, reset row selection
  const handleClose = () => {
    reset();
    onRequestClose();
  };
  const updateSelection = (
    event: React.ChangeEvent<HTMLInputElement>,
    data: { selection: GitHubUser[] },
  ) => {
    setSelection(data.selection);
  };
  const handleSubmit = () => {
    setUsers([...selection]);
    reset();
  };

  return (
    <Modal
      isOpen={isOpen}
      heading={heading}
      assistiveText={{ closeButton: i18n.t('Cancel') }}
      footer={
        allUsers.length
          ? [
              <Button
                key="cancel"
                label={i18n.t('Cancel')}
                onClick={handleClose}
              />,
              <Button
                key="submit"
                type="submit"
                label={i18n.t('Save')}
                variant="brand"
                onClick={handleSubmit}
              />,
            ]
          : null
      }
      size="small"
      onRequestClose={handleClose}
    >
      <div
        className="slds-grid
          slds-grid_vertical-align-start
          slds-p-around_medium"
      >
        <div className="slds-grid slds-wrap slds-shrink slds-p-right_medium">
          <p>
            <Trans i18nKey="epicCollaborators">
              Only users who have access to the GitHub repository for this epic
              will appear in the list below. Visit GitHub to invite additional
              collaborators.
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
            refreshUsers={refreshUsers}
          />
        </div>
      </div>
      <div className="slds-is-relative">
        {allUsers.length ? (
          <DataTable
            className="align-checkboxes table-row-targets"
            items={allUsers}
            selectRows="checkbox"
            selection={selection}
            onRowChange={updateSelection}
          >
            <DataTableColumn
              label={i18n.t('GitHub Users')}
              property="login"
              primaryColumn
              truncate
            >
              <UserTableCell handleUserClick={handleUserClick} />
            </DataTableColumn>
          </DataTable>
        ) : (
          <div className="slds-p-around_medium">
            <EmptyIllustration
              message={
                <Trans i18nKey="noGitHubUsers">
                  We couldn’t find any GitHub users who have access to this
                  project. Try re-syncing the list of available collaborators,
                  or contact an admin for this project on GitHub.
                </Trans>
              }
            />
          </div>
        )}
        {isRefreshing && <SpinnerWrapper />}
      </div>
    </Modal>
  );
};
