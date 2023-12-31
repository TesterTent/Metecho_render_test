import React from 'react';

import ErrorBoundary from '@/js/components/error';

import { render } from './../utils';

class TestableErrorBoundary extends ErrorBoundary {
  constructor(props) {
    super(props);
    this.state = { hasError: true };
  }
}

describe('<ErrorBoundary />', () => {
  test('renders children', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <div>child</div>
      </ErrorBoundary>,
    );

    expect(getByText('child')).toBeVisible();
  });

  test('renders error msg if errors', () => {
    const { getByText, queryByText } = render(
      <TestableErrorBoundary>
        <div>child</div>
      </TestableErrorBoundary>,
    );

    expect(queryByText('child')).toBeNull();
    expect(getByText('¯\\_(ツ)_/¯')).toBeVisible();
  });
});
