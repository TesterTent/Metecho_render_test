import Avatar from '@salesforce/design-system-react/components/avatar';
import PageHeader from '@salesforce/design-system-react/components/page-header';
import PageHeaderControl from '@salesforce/design-system-react/components/page-header/control';
import React from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';

import Errors from '@/components/apiErrors';
import OfflineAlert from '@/components/offlineAlert';
import Logout from '@/components/user/logout';
import { selectSocketState } from '@/store/socket/selectors';
import { selectUserState } from '@/store/user/selectors';
import routes from '@/utils/routes';

const Controls = () => {
  const user = useSelector(selectUserState);
  return (
    <>
      <Avatar />
      <span className="slds-p-left_small">{user && user.username}</span>
      <Logout />
    </>
  );
};

const Header = () => {
  const controls = () => (
    <PageHeaderControl className="slds-grid slds-grid_vertical-align-center">
      <Controls />
    </PageHeaderControl>
  );
  const user = useSelector(selectUserState);
  const socket = useSelector(selectSocketState);

  return user ? (
    <>
      {socket ? null : <OfflineAlert />}
      <Errors />
      <PageHeader
        className="global-header
          slds-p-horizontal_x-large
          slds-p-vertical_medium"
        title={
          <Link
            to={routes.home()}
            className="slds-text-heading_large slds-text-link_reset"
          >
            <span data-logo-bit="start">meta</span>
            <span data-logo-bit="end">share</span>
          </Link>
        }
        onRenderControls={controls}
      />
    </>
  ) : null;
};

export default Header;
