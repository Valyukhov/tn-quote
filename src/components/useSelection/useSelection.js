import { selectionsFromQuoteAndVerseObjects } from '../../utils/srrcl';
import { formatToString, parseVerseObjects } from '../../utils/selections';

function useSelection({
  chapter,
  verses,
  greekVerseObjects = [],
  targetVerseObjects = [],
  quote = '',
  occurrence = 0,
}) {
  if (
    occurrence === 0 ||
    greekVerseObjects.length === 0 ||
    targetVerseObjects.length === 0 ||
    quote === '' ||
    verses.length === 0
  ) {
    return;
  }

  const selections = selectionsFromQuoteAndVerseObjects({
    quote,
    verseObjects: greekVerseObjects,
    occurrence,
    chapter,
    verses,
  });

  const result = targetVerseObjects.map((el) =>
    parseVerseObjects(el, selections, { chapter, verse: verses[0] })
  );

  return formatToString(result);
}

export default useSelection;
