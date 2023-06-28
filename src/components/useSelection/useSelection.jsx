import React from 'react';

import PropTypes from 'prop-types';

function useSelection({
  greekVerseObjects,
  targetVerseObjects,
  quote,
  occurrence,
  chapter,
  verses,
}) {
  return <></>;
}

useSelection.defaultProps = {
  greekVerseObjects: [],
  targetVerseObjects: [],
  quote: '',
  occurrence: 0,
};

useSelection.propTypes = {
  /** greekVerseObjects */
  greekVerseObjects: PropTypes.object,
  /** targetVerseObjects */
  targetVerseObjects: PropTypes.object,
  /** greek quote */
  quote: PropTypes.string,
  /** occurrence */
  occurrence: PropTypes.number,
  /** chapter */
  chapter: PropTypes.number,
  /** verses */
  verses: PropTypes.array,
};

export default useSelection;
