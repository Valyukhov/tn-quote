import { useEffect, useState } from 'react';

import axios from 'axios';

import { usfmToJSON } from 'usfm-js/lib/js/usfmToJson';

import { selectionsFromQuoteAndVerseObjects } from '../../utils/srrcl';
import { bookUrl } from '../../utils/constants';

function useOccurrence({ book, chapter, verses, quotes = [] }) {
  const [usfm, setUsfm] = useState(false);
  const [verseObjects, setVerseObjects] = useState([]);
  useEffect(() => {
    const main = async () => {
      if (book) {
        let file;
        try {
          file = await axios.get('https://git.door43.org/' + bookUrl[book]);
        } catch (error) {
          return false;
        }
        setUsfm(usfmToJSON(file.data));
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
