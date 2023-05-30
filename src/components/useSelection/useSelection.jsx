import React from 'react';
import { log } from '../../utils';
import PropTypes from 'prop-types';

function useSelection({
  greekVerseObjects,
  targetVerseObjects,
  quote,
  occurrence,
  chapter,
  verses,
}) {
  log('test');
  return <></>;
}

useSelection.defaultProps = {
  greekVerseObjects: {},
  targetVerseObjects: {},
  quote: '',
  occurrence: 0,
};

useSelection.propTypes = {
  /** greek quote */
  quote: PropTypes.string,
  /** occurrence */
  occurrence: PropTypes.number,
};

export default useSelection;
