import Button from '@salesforce/design-system-react/components/button';
import Search from '@salesforce/design-system-react/components/input/search';
import { t } from 'i18next';
import React, { useState } from 'react';

import { pluralize } from '@/js/utils/helpers';

const SearchIssues = ({
  searchIssues,
  count,
  total,
  hasSearch,
}: {
  searchIssues: (searcht: string) => void;
  count: number;
  total: number;
  hasSearch: boolean;
}) => {
  const [searchterm, setSearchterm] = useState('');
  const handleSearchterm = (
    event: React.ChangeEvent<HTMLInputElement>,
    { value }: { value: string },
  ) => {
    setSearchterm(value);
  };

  const clearSearch = () => {
    searchIssues('');
    setSearchterm('');
  };

  const getSearchResults = () => {
    searchIssues(searchterm);
  };

  const countMsg = t(
    'issueResultsCount',
    `${count} ${pluralize(count, 'result')} of`,
    { count },
  );
  const totalMsg = t(
    'issueCount',
    `${total} total ${pluralize(total, 'issue')}`,
    { count: total },
  );

  return (
    <div className="form-grid" data-form="search-issues">
      <Search
        placeholder={t('Search issues by title or number')}
        inlineHelpText={hasSearch ? `${countMsg} ${totalMsg}` : totalMsg}
        name="search"
        value={searchterm}
        clearable
        onChange={handleSearchterm}
        onClear={clearSearch}
        onSearch={getSearchResults}
      />
      <Button
        label={t('Search')}
        onClick={getSearchResults}
        className={'issues-search-button'}
      />
    </div>
  );
};

export default SearchIssues;
