import React from 'react';

import PropTypes from 'prop-types';

function useOccurrence({ quotes, book, chapter, verses, domain }) {
  return <></>;
}

useOccurrence.defaultProps = {
  verses: [],
  quotes: [],
  domain: 'https://git.door43.org',
};

useOccurrence.propTypes = {
  /** quotes */
  quotes: PropTypes.array,
  /** book */
  book: PropTypes.string,
  /** chapter */
  chapter: PropTypes.number,
  /** verses */
  verses: PropTypes.array,
  /** domain */
  domain: PropTypes.string,
};

export default useOccurrence;
