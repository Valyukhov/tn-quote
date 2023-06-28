import { usfmToJSON } from 'usfm-js/lib/js/usfmToJson';
import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import jsyaml from 'js-yaml';
import { formatLink, getExtraTNotes } from '../../utils/selections';
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

function useQuotesTranslation({
  book,
  tnotes: _tnotes,
  usfm: { jsonChapter, link },
  domain = 'https://git.door43.org',
}) {
  const [greekUsfm, setGreekUsfm] = useState(false);
  const [tnotes, setTnotes] = useState(() => _tnotes);
  const [chapter, setChapter] = useState(0);
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

  const getManifest = useCallback(async (repoLink) => {
    let data;
    try {
      const res = await axios.get(repoLink + '/manifest.yaml');
      data = res.data;
    } catch (error) {
      return false;
    }
    const manifest = jsyaml.load(data, { json: true });
    return manifest;
  }, []);

  useEffect(() => {
    const main = async () => {
      if (jsonChapter) {
        setTargetUsfmChapter(jsonChapter);
      } else {
        if (link && chapter) {
          const repoLink = formatLink(link, domain);
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
          setTargetUsfmChapter(usfmToJSON(_data.data)?.chapters?.[chapter] ?? []);
        }
      }
    };
    main();
  }, [link, chapter, book, !!jsonChapter]);

  // кешируем юсфм
  useEffect(() => {
    const main = async () => {
      let file;
      try {
        file = await axios.get(domain + '/' + bookUrl[book]);
      } catch (error) {
        return false;
      }
      setGreekUsfm(usfmToJSON(file.data));
    };
    if (book) {
      main();
    }
  }, [book]);

  // кешируем главу (это не обязательно)
  useEffect(() => {
    if (greekUsfm && chapter) {
      setGreekUsfmChapter(greekUsfm?.chapters?.[chapter] ?? []);
    }
  }, [greekUsfm, chapter]);

  useEffect(() => {
    const extraTNotes = getExtraTNotes(tnotes, greekUsfmChapter, targetUsfmChapter);

    if (extraTNotes) {
      setExtraTNotes(extraTNotes);
    }
  }, [greekUsfmChapter, targetUsfmChapter, tnotes]);

  return { extraTNotes, setTnotes };
}

export default useQuotesTranslation;
