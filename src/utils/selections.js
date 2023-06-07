import { normalizeString } from './srrcl';

/**
 * Метод для того чтобы получить правильную ссылку
 * @param {string} link абсолютная или относительная ссылка на репозиторий или ветку или коммит
 *
 * @example
 * formatLink('https://git.door43.org/unfoldingWord/en_ult/');
 * // returns https://git.door43.org/unfoldingWord/en_ult/src/branch/master
 * formatLink('unfoldingWord/en_ult');
 * // returns https://git.door43.org/unfoldingWord/en_ult/src/branch/master
 * formatLink('unfoldingWord/en_ult/src/commit/ac345f982fcab3/');
 * // returns https://git.door43.org/unfoldingWord/en_ult/src/commit/ac345f982fcab3
 *
 * @returns {string}
 */
export function formatLink(link) {
  let url;
  try {
    url = new URL(link, 'https://git.door43.org/');
  } catch (error) {
    return 'https://git.door43.org/unfoldingWord/en_ult/src/branch/master';
  }
  url.host = 'git.door43.org';
  let path = url.pathname;
  path = path.slice(1);
  if (path[path.length - 1] === '/') {
    path = path.slice(0, -1);
  }
  const pathEl = path.split('/');
  if (pathEl.length === 2) {
    pathEl.push('raw', 'branch', 'master');
  }
  if (pathEl[2] === 'src') {
    pathEl[2] = 'raw';
  }
  url.pathname = '/' + pathEl.join('/');
  return url.href;
}

/**
 *
 * @param {string} tsv tsv file content
 * @param {[string]} headers array of columns
 * @param {boolean} splitReference whether it is necessary to break the `Reference` into a `chapter` and a `verse`
 * @returns {[array]}
 */
export const tsvToJSON = (tsv, headers, splitReference = false) => {
  tsv = tsv.split('\n');
  const currentHeaders = tsv[0].split('\t');
  tsv = tsv.slice(1);
  const notes = [];
  for (let i = 0; i < tsv.length; i++) {
    const el = tsv[i];
    const line = el.split('\t');
    if (line.length !== currentHeaders.length) {
      continue;
    }
    const note = {};
    for (let index = 0; index < currentHeaders.length; index++) {
      if (headers.includes(currentHeaders[index])) {
        note[currentHeaders[index]] = line[index];
        if (splitReference && currentHeaders[index].toLowerCase() === 'reference') {
          const [chapter, verse] = line[index].split(':');
          if (chapter && verse) {
            note.chapter = chapter;
            if (verse.indexOf('-') > 0) {
              note.verse = [];
              const [min, max] = verse.split('-');
              for (let r = parseInt(min); r <= parseInt(max); r++) {
                note.verse.push(r);
              }
            } else {
              note.verse = [verse];
            }
          }
        }
      }
    }
    notes.push(note);
  }
  return notes;
};

export const formatToString = (res) => {
  /**
   * надо пройти в цикле по тому что получилось
   * 1. Пропускаем все, пока не попадется первое слово
   * 2. Теперь к слову можно добавлять следующие не пустые строки
   * 3. Если попадается пустая строка, то пропускаем до следующего слова
   * 4. Если есть то ставим три точки и повторяем со 2 пункта
   * 5. Если больше нет слов, то надо все символы убрать, по этому не стоит их прибавлять сразу, собирать лучше
   * Либо такой вариант
   * 1. Пропускем все, пока не попадется элемент, у которого первый символ - спецсимвол
   * 2. Прибавляем к нему все, пока не попадется пустая строка.
   * 3. С этого момента мы запоминаем и проверяем дальше слова.
   * 4. Если больше ничего нет то удаляем все символы, пробелы и т.д., что мы могли добавить
   * 5. Если попалось новое слово, то ставим три точки и добавляем снова все что идет
   */
  let resultString = ''; // это итоговая строка с текстом
  let addon = ''; // тут мы будем собирать все что после слова остается
  // проходим в цикле по каждому слову
  let dotted = false;
  for (const word of res) {
    if (!resultString.length) {
      // если еще нет никаких слов
      if (word[0] === '~') {
        // если это наше слово то добавим его
        resultString = word.slice(1);
      } // если нет то идем дальше
    } else {
      if (word === '') {
        // если это пустое значение, значит при появлении нового слова надо будет поставить три точки
        dotted = true;
        continue;
      }
      if (word[0] === '~') {
        // если это наше слово то
        if (dotted) {
          // если между словами были какие-то другие слова - поставим три точки
          dotted = false;
          addon = '';
          resultString += '... ' + word.slice(1);
        } else {
          // если небыло между словами других слов
          resultString += addon + word.slice(1);
          addon = '';
        }
        continue;
      }
      if (/\w/gi.test(word)) {
        // если это какие-то непривязанные слова то будем ставить три точки
        dotted = true;
      } else {
        // значит тут пробелы, запятые и другие символы
        addon += word;
      }
    }
  }
  return resultString;
};

export const parseVerseObjects = (verseObject, selections, reference) => {
  switch (verseObject.type) {
    case 'quote':
      if (verseObject.children) {
        return verseObject.children.map((el) =>
          parseVerseObjects(el, selections, reference)
        );
      }

      break;
    case 'milestone':
      switch (verseObject.tag) {
        case 'k':
          return verseObject.children.map((el) =>
            parseVerseObjects(el, selections, reference)
          );
        case 'zaln':
          if (
            verseObject.children.length === 1 &&
            verseObject.children[0].type === 'milestone'
          ) {
            return parseVerseObjects(verseObject.children[0], selections, reference);
          } else {
            if (verseObject.strong) {
              const selected = areSelected({
                words: [verseObject],
                selections,
                reference,
              });
              return selected
                ? '~' +
                    verseObject.children
                      .map((_verseObject) => _verseObject.text || _verseObject.content)
                      .join('')
                : '';
            }
            break;
          }
      }
      break;
    case 'text':
      return verseObject.text;
    case 'word':
      if (verseObject.strong) {
        const selected = areSelected({
          words: [verseObject],
          selections,
          reference,
        });
        return selected ? '~' + (verseObject.text || verseObject.content) : '';
      }
      break;
  }
  return '';
};

export const areSelected = ({
  words,
  selections,
  reference = { chapter: 100, verse: 100 },
}) => {
  let selected = false;
  const _selections = words.map((word) => selectionFromWord(word));
  _selections.forEach((selection) => {
    const _selection = JSON.parse(selection);
    let _text = normalizeString(_selection.text);
    let _occ = _selection.occurrence;
    let _occs = _selection.occurrences;
    let { chapter: _ch = 100, verse: _v = 100 } = reference;

    for (let i = 0; i < selections.length; i++) {
      const text = selections[i].text; //already normalized.
      const occ = selections[i].occurrence;
      const occs = selections[i].occurrences;
      const { chapter: ch = 100, verse: v = 100 } = selections[i].reference;
      if (
        text === _text &&
        occ === _occ &&
        occs === _occs &&
        parseInt(ch) === parseInt(_ch) &&
        parseInt(v) === parseInt(_v)
      ) {
        selected = true;
        break;
      }
    }
  });
  return selected;
};

export const selectionFromWord = (word) => {
  const { content, text, occurrence, occurrences } = word;
  const selectionObject = {
    text: content || text,
    occurrence: parseInt(occurrence),
    occurrences: parseInt(occurrences),
  };
  const selection = JSON.stringify(selectionObject);
  return selection;
};
