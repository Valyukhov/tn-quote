import { usfmToJSON } from 'usfm-js/lib/js/usfmToJson';
import { selectionsFromQuoteAndVerseObjects } from '../../utils/srrcl';
import { useEffect, useState } from 'react';

function useOccurrence({ book, chapter, verses, quotes = [] }) {
  const [usfm, setUsfm] = useState(false);
  const [verseObjects, setVerseObjects] = useState([]);
  useEffect(() => {
    const main = async () => {
      if (book) {
        const bookName = book.toUpperCase();
        const file = await require(`../../bible/${bookName}.js`);
        setUsfm(usfmToJSON(file?.default ? file.default : file));
      }
    };
    main();
  }, [book]);

  useEffect(() => {
    if (usfm) {
      if (verses.length > 1) {
        const verseObjects = verses.map(
          (verse) => usfm?.chapters?.[chapter]?.[verse]?.verseObjects ?? []
        );
        setVerseObjects(verseObjects);
      } else {
        setVerseObjects(usfm?.chapters?.[chapter]?.[verses[0]]?.verseObjects ?? []);
      }
    }
  }, [usfm?.headers?.[0]?.content, verses.toString(), chapter]);
  const selections = selectionsFromQuoteAndVerseObjects({
    verseObjects,
    quote: quotes?.[0]?.quote,
    occurrence: quotes?.[0]?.occurrence,
    chapter,
    verses,
  });
  return selections;
}

export default useOccurrence;
