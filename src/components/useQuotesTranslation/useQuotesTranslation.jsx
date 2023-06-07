import React from 'react';
import PropTypes from 'prop-types';

function useQuotesTranslation({ book, tnotes, usfm: { jsonChapter, link } }) {
  return <></>;
}

useQuotesTranslation.defaultProps = {};

useQuotesTranslation.propTypes = {
  /** book */
  book: PropTypes.string,
  /** tnotes */
  tnotes: PropTypes.array,
  /** usfm */
  usfm: PropTypes.shape({ jsonChapter: PropTypes.array, link: PropTypes.string }),
};

export default useQuotesTranslation;
