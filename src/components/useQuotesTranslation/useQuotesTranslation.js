import { usfmToJSON } from 'usfm-js/lib/js/usfmToJson';
import { selectionsFromQuoteAndVerseObjects } from '../../utils/srrcl';
import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import jsyaml from 'js-yaml';
import { formatLink, formatToString, parseVerseObjects } from '../../utils/selections';
import { bookUrl } from '../../utils/constants';

/**
 * нам надо вернуть переводы всех цитат из ноутсов
 * приходит айди книги, номер главы
 * Скорее всего надо будет для одной главы такое отдавать, или диапазон стихов в рамках одной главы, по этому не усложняем пока что
 * приходит массив ноутсов
 * Что если нам принимать в том же формате что и хранится в тн, тогда никому не надо будет что-то там форматировать перед тем как отдать в библиотеку
 * если в том же виде, то мы можем и вернуть в том же виде, просто дописать колонку, к примеру OrigQuote и Quote
 * первый шаг это получить главу на греческом
 * второе - получить главу на целевом языке
 * затем получить все occurrence
 * и после этого проходить по каждому элементу, получать перевод и сохранять
 */

function useQuotesTranslation({ book, tnotes: _tnotes, usfm: { jsonChapter, link } }) {
  const [greekUsfm, setGreekUsfm] = useState(false);
  const [tnotes, setTnotes] = useState(() => _tnotes);
  const [chapter, setChapter] = useState(0);
  const [targetUsfm, setTargetUsfm] = useState(false);
  const [targetUsfmChapter, setTargetUsfmChapter] = useState({});
  const [greekUsfmChapter, setGreekUsfmChapter] = useState({});
  const [extraTNotes, setExtraTNotes] = useState([]);

  useEffect(() => {
    if (tnotes?.length > 0) {
      const ref = tnotes[0]?.Reference;
      const [chapter] = ref.split(':');
      if (chapter) {
        setChapter(chapter);
      }
    }
  }, [tnotes]);

  const getManifest = useCallback(
    async (repoLink) => {
      let data;
      try {
        const res = await axios.get(repoLink + '/manifest.yaml');
        data = res.data;
      } catch (error) {
        return false;
      }
      const manifest = jsyaml.load(data, { json: true });
      return manifest;
    },
    [link]
  );

  useEffect(() => {
    const main = async () => {
      if (!jsonChapter && link) {
        const repoLink = formatLink(link);
        const manifest = await getManifest(repoLink);

        if (!manifest) {
          return false;
        }
        const bookPath = manifest.projects.find((el) => el.identifier === book)?.path;
        let url;
        if (bookPath.slice(0, 2) === './') {
          url = `${repoLink}/${bookPath.slice(2)}`;
        } else {
          url = `${repoLink}/${bookPath}`;
        }
        let _data;
        try {
          _data = await axios.get(url);
        } catch (error) {
          return false;
        }
        const _usfm = usfmToJSON(_data.data);
        setTargetUsfm(_usfm);
      }
    };
    main();
  }, [link, book, !!jsonChapter]);

  useEffect(() => {
    const main = async () => {
      if (jsonChapter) {
        setTargetUsfmChapter(jsonChapter);
      } else {
        if (link && chapter) {
          const repoLink = formatLink(link);
          const manifest = await getManifest(repoLink);

          if (!manifest) {
            return false;
          }
          const bookPath = manifest.projects.find((el) => el.identifier === book)?.path;
          let url;
          if (bookPath.slice(0, 2) === './') {
            url = `${repoLink}/${bookPath.slice(2)}`;
          } else {
            url = `${repoLink}/${bookPath}`;
          }
          let _data;
          try {
            _data = await axios.get(url);
          } catch (error) {
            return false;
          }
          const _usfm = usfmToJSON(_data.data);
          setTargetUsfm(_usfm);
          setTargetUsfmChapter(_usfm?.chapters?.[chapter] ?? []);
        }
      }
    };
    main();
  }, [link, chapter, book, !!jsonChapter]);

  // кешируем юсфм
  useEffect(() => {
    const main = async () => {
      if (book) {
        let file;
        try {
          file = await axios.get('https://git.door43.org/' + bookUrl[book]);
        } catch (error) {
          return false;
        }
        setGreekUsfm(usfmToJSON(file.data));
      }
    };
    main();
  }, [book]);

  // кешируем главу (это не обязательно)
  useEffect(() => {
    if (greekUsfm && chapter) {
      setGreekUsfmChapter(greekUsfm?.chapters?.[chapter] ?? []);
    }
  }, [greekUsfm, chapter]);

  useEffect(() => {
    if (Object.keys(greekUsfmChapter).length && Object.keys(targetUsfmChapter).length) {
      const extraTNotes = tnotes.map((_tnote) => {
        const tnote = { ..._tnote };
        let greekVerseObjects, targetVerseObjects;
        if (tnote.verse.length === 1) {
          greekVerseObjects = greekUsfmChapter?.[parseInt(tnote.verse[0])]?.verseObjects;
          targetVerseObjects = [
            targetUsfmChapter?.[parseInt(tnote.verse[0])]?.verseObjects,
          ];
        } else {
          greekVerseObjects = tnote.verse.map(
            (verse) => greekUsfmChapter?.[verse]?.verseObjects
          );
          targetVerseObjects = tnote.verse.map(
            (verse) => targetUsfmChapter?.[verse]?.verseObjects
          );
        }
        const selections = selectionsFromQuoteAndVerseObjects({
          quote: tnote.Quote,
          verseObjects: greekVerseObjects,
          occurrence: tnote.Occurrence,
          chapter: tnote.chapter,
          verses: tnote.verse,
        });
        const result = tnote.verse
          .map((verse, index) => {
            return targetVerseObjects[index].map((vo) =>
              parseVerseObjects(vo, selections, {
                chapter: tnote.chapter,
                verse,
              })
            );
          })
          .reduce((acc, cur) => [...acc, ...cur], []);
        tnote.origQuote = tnote.Quote;
        tnote.Quote = formatToString(result);
        return tnote;
      });
      setExtraTNotes(extraTNotes);
    }
  }, [greekUsfmChapter, targetUsfmChapter, tnotes]);

  return { extraTNotes, setTnotes };
}

export default useQuotesTranslation;
