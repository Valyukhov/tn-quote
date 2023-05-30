import { tokenize } from 'string-punctuation-tokenizer';
import xre from 'xregexp';

/**
 * The function will find the quote in the verse object
 * @param {string} quote - The orignal quote to find
 * @param {object} verseObjects - verse ojects to search
 * @param {number} occurrence - The occurrence to match
 * @returns {[]} - The quotes we found
 */
export const selectionsFromQuoteAndVerseObjects = ({
  verseObjects,
  quote,
  occurrence,
  chapter = 100,
  verses = [100],
}) => {
  if (occurrence === 0) {
    return [];
  }
  let selections = [];
  if (quote && verseObjects.length > 0 && verses.length > 0) {
    if (verses.length > 1) {
      const _verseObjects = verseObjects.reduce((prev, curr) => [...prev, ...curr], []);
      const string = verseObjectsToString(_verseObjects);
      selections = selectionsFromQuoteAndString({ quote, string, occurrence });
      const newSelections = [];
      for (let id = 0; id < selections.length; id++) {
        const sel = { ...selections[id] };
        for (let index = 0; index < verseObjects.length; index++) {
          const tmpSelections = selectionsFromQuoteAndVerseObjects({
            quote: sel.text,
            verseObjects: verseObjects[index],
            occurrence: -1,
            reference: { chapter, verse: verses[index] },
          });
          if (tmpSelections.length === 0) {
            continue;
          }
          if (sel.occurrence > tmpSelections[0].occurrences) {
            sel.occurrence -= tmpSelections[0].occurrences;
          } else {
            newSelections.push({
              text: sel.text,
              occurrence: sel.occurrence,
              reference: {
                chapter: parseInt(chapter),
                verse: parseInt(verses[index]),
              },
              occurrences: tmpSelections[0].occurrences,
            });
            break;
          }
        }
      }
      selections = [...newSelections];
    } else {
      const string = verseObjectsToString(verseObjects);
      selections = selectionsFromQuoteAndString({
        quote,
        string,
        occurrence,
      }).map((el) => ({
        ...el,
        reference: {
          chapter: parseInt(chapter),
          verse: parseInt(verses[0]),
        },
      }));
    }
  }
  return selections
    .map((el) =>
      el.occurrences === 0 ? 0 : el.occurrence > el.occurrences ? 0 : el.occurrences
    )
    .includes(0)
    ? []
    : selections;
};

export const referenceIdsFromBcvQuery = (bcvQuery) => {
  const resArray = [];
  if (bcvQuery?.book) {
    Object.entries(bcvQuery?.book).forEach(([bookKey, { ch }]) => {
      Object.entries(ch).forEach(([chNum, { v }]) => {
        Object.entries(v).forEach(([vNum]) => {
          resArray.push(`${chNum}:${vNum}`);
        });
      });
    });
  }
  return resArray;
};

/**
 * @description flatten verse objects from nested format to flat array
 * @param {array} verseObjects - source array of nested verseObjects
 * @param {array} flat - output array that will be filled with flattened verseObjects
 */
export const flattenVerseObjects = (verseObjects, flat = []) => {
  let _verseObjects = [...verseObjects];
  while (_verseObjects.length > 0) {
    const object = _verseObjects.shift();
    if (object) {
      if (object.type === 'milestone') {
        // get children of milestone
        const _flat = flattenVerseObjects(object.children);
        _flat.forEach((_object) => flat.push(_object));
      } else {
        flat.push(object);
      }
    }
  }
  return flat;
};

export const verseObjectsToString = (verseObjects) => {
  const flattenedVerseObjects = flattenVerseObjects(verseObjects);
  const string = flattenedVerseObjects.map((verseObject) => verseObject.text).join(' ');
  return string;
};

/**
 * The function will find the quote inside the string
 * @param {string} quote - The orignal quote to find
 * @param {string} string - orignal text to search
 * @param {number} occurrence - The occurrence to match
 * @returns {[]} - The quotes we found
 */
export const selectionsFromQuoteAndString = ({
  quote,
  string: rawString,
  occurrence,
}) => {
  let string = normalizeString(rawString);
  // Calculate hasAmpersand before normalizing quote.
  let _subquotes = quote.replace(/( ?… ?)+/g, ' & '); //replace elipse with '&'
  let subquotes = _subquotes.split('&').map(normalizeString); // разбиваем по амперсанду строку на подстроки
  let selections = []; // массив со словами которые надо подсветить
  const hasAmpersand = subquotes.length > 1; // есть ли амперсанд

  if (hasAmpersand && occurrence === -1) {
    // с амперсандом нельзя подсвечивать все возможные варианты (непонятно почему так, вроде же можно сделать (хотя теперь понятно, ниже идет подсчет, вхождений, если будет амперсанд, то будет сложнее регулярку написать)), нужен какой-то конкретный
    return [];
  }

  if (occurrence === -1) {
    // если нужны все вхождения то
    // считаем количество вхождений в стихе и делаем так, типа они написаны через амперсанд, подстроки
    quote = normalizeString(quote); // чистим цитату от лишнего
    const occurrences = getPrecedingOccurrences(string, quote);
    subquotes = new Array(occurrences).fill(quote);
  }
  let precedingText = ''; // это текст который до слова, нужен только для амперсанда или -1
  let precedingOccurrences = 0; // это вроде количество предыдущих вхождений
  subquotes.forEach((subquote, index) => {
    // этот код по большей части для нескольких слов через амперсанд
    // надо проверить, как он работает для одного слова и -1, слово и 2, несколько слов через &
    precedingOccurrences = getPrecedingOccurrences(precedingText, subquote); // считаем сколько раз слово встречалось в предыдущем тексте (работает только для &)
    // без амперсанда у нас будет 0
    const currentOccurrence = getCurrentOccurrenceFromPrecedingText(
      occurrence,
      index,
      precedingOccurrences
    ); // количество, которое нам надо дальше, надо понять как его считать и почему у меня пишет 4 из трех
    precedingText = getPrecedingText(
      string,
      subquote,
      currentOccurrence,
      precedingOccurrences
    ); // тут мы получаем текст, который до искомого слова шел
    const subSelections = subSelectionsFromSubquote({
      subquote,
      precedingText,
      string,
    });

    subSelections.forEach((subSelection) => selections.push(subSelection));
    /** Adding the previous subquote to account for repeated ampersand words i.e. Θεοῦ&Θεοῦ */
    precedingText += subquote; // добавляем искомое слово к тексту который был до слова
  });
  return selections;
};

export const normalizeString = (string) => {
  const normalized = tokenizer(string).join(' ');
  return normalized;
};

const tokenizer = (text) => {
  return tokenize({
    text: text,
    greedy: true,
    normalize: true,
  });
};

/**
 * This counts the number of subquotes in the string
 * @param {string} string - string we are searching in
 * @param {string} subquote - string we are searching for
 * @returns {number} number
 */
export const getPrecedingOccurrences = (string, subquote) => {
  if (!string || !subquote) {
    return 0;
  }
  const regex = getRegexForWord(subquote);
  const matches = xre.match(string, regex, 'all');
  const count = (matches && matches.length) || 0;
  return count;
};

/**
 * This function gets the correct amount of occurrences to provide the function getPrecedingText
 *
 * @param {number} occurrence - The occurrence of the subquote in the string
 * @param {number} index - The current index of the subquotes
 * @param {number} precedingOccurrences - The number of occurrences before the current subquote in the string
 */
export const getCurrentOccurrenceFromPrecedingText = (
  occurrence,
  index,
  precedingOccurrences
) => {
  if (occurrence === -1 || index === 0) {
    return occurrence;
  } else {
    return precedingOccurrences + 1;
  }
};

/**
 *
 * @param {string} string - The entire string to use to find the preceding text
 * @param {string} subquote - The subquote to find the preceding text of
 * @param {number} occurrence - The occurrence of the string in the entire string
 * @param {number} index - The index of the subquote
 */
export const getPrecedingText = (string, subquote, occurrence, index = 0) => {
  const regex = getRegexForWord(subquote);
  let splitString = xre.split(string, regex);
  if (occurrence === -1) {
    // вот еще один момент, возможно, из за которого неполучится использовать амперсанд и -1
    //Need every occurrence of the subquote
    //Using the index instead of the occurrence
    return splitString.slice(0, index + 1).join(subquote);
  } else {
    //Return the subquote at the specified occurrence
    //of the entire string
    return splitString.slice(0, occurrence).join(subquote);
  }
};

export const subSelectionsFromSubquote = ({
  subquote,
  precedingText: _precedingText,
  string,
}) => {
  //Splitting by tokenization here causes issues because we are still
  //comparing those characters at this level
  const selectedTokens = subquote.split(' '); // разбиваем искомую строку по словам
  const subSelections = [];
  selectedTokens.forEach((_selectedText) => {
    // для каждого слова
    //Adding the preceding text from the subSelections to ensure that
    //Repeated words are accounted for
    const precedingTextInSubselections = subSelections.map(({ text }) => text).join(' ');
    let subSelection = generateSelection({
      selectedText: _selectedText,
      precedingText: _precedingText + precedingTextInSubselections,
      entireText: string,
    });

    subSelections.push(subSelection);
  });
  return subSelections;
};

/**
 * This function takes a search string and create a regex search string to match a whole word
 * @param {string} string - string to search for
 * @returns {RegExp} regex expression
 */
export const getRegexForWord = (string) => {
  const START_WORD_REGEX = '(?<=[\\s,.:;“"\'‘({]|^)';
  const END_WORD_REGEX = '(?=[\\s,.:;“"\'‘!?)}]|$)';
  const search = `${START_WORD_REGEX}${string}${END_WORD_REGEX}`;
  const regex = xre(search, 'u');
  return regex;
};

/**
 * @description - generates a selection object from the selected text, precedingText and whole text
 * @param {String} selectedText - the text that is selected
 * @param {String} precedingText - the text that prescedes the selection
 * @param {String} entireText - the text that the selection should be in
 * @return {Object} - the selection object to be used
 */
export const generateSelection = ({ selectedText, precedingText, entireText }) => {
  // replace more than one contiguous space with a single one since HTML/selection only renders 1
  const _entireText = normalizeString(entireText);
  // Getting the occurrences before the current token
  const precedingTokens = tokenizer(precedingText);
  let precedingOccurrencesInPreviousString = precedingTokens.reduce(function (n, val) {
    return n + (val === selectedText);
  }, 0);
  // calculate this occurrence number by adding it to the preceding ones
  let occurrence = precedingOccurrencesInPreviousString + 1;
  // get the total occurrences from the verse
  const allTokens = tokenizer(_entireText);
  let allOccurrences = allTokens.reduce(function (n, val) {
    return n + (val === selectedText);
  }, 0);

  return {
    text: selectedText,
    occurrence: occurrence,
    occurrences: allOccurrences,
  };
};
