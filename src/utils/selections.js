import { normalizeString } from './srrcl';

export const tsvToJSON = (tsv) => {
  return tsv
    .split('\n')
    .slice(1)
    .map((el) => {
      const line = el.split('\t');
      return {
        chapter: line[0].split(':')[0],
        verse: line[0].split(':')[1],
        occurrence: line[5],
        quote: line[4],
      };
    });
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
