import React from 'react';

import PropTypes from 'prop-types';

function useOccurrence({ quotes, book, chapter, verses }) {
  return <></>;
}

useOccurrence.defaultProps = {
  verses: [],
  quotes: [],
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
};

export default useOccurrence;
