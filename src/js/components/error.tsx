import { EmptyIllustration } from '_js/components/404';
import { logError } from '_js/utils/logging';
import routes from '_js/utils/routes';
import React, { Component, ReactNode } from 'react';
import { Trans } from 'react-i18next';

interface Props {
  children: ReactNode;
}

class ErrorBoundary extends Component<Props, { hasError: boolean }> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  /* istanbul ignore next */
  componentDidCatch(error: Error, info: { [key: string]: any }) {
    this.setState({ hasError: true });
    logError(error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <EmptyIllustration
          message={
            <Trans i18nKey="anErrorOccurred">
              An error occurred. Try the <a href={routes.home()}>home page</a>?
            </Trans>
          }
        />
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
