# New Testament

```jsx
import React, { useEffect, useState } from 'react';

import { useQuotesTranslation } from '@texttree/tn-quote';

function Component() {
  const [data, setData] = useState('loading');
  const { extraTNotes, setTnotes } = useQuotesTranslation({
    book: 'jhn',
    tnotes: [{ Reference: '1:1', chapter: 1, verse: [1], Quote: 'λόγος', Occurrence: 2 }],
    usfm: { link: 'unfoldingWord/en_ult' },
  });
  useEffect(() => {
    setData(JSON.stringify(extraTNotes, null, 2));
  }, [extraTNotes]);
  return <pre>{data}</pre>;
}

<Component />;
```

```jsx
import React, { useEffect, useState } from 'react';

import { useQuotesTranslation } from '@texttree/tn-quote';

function Component() {
  const [data, setData] = useState('loading');
  const { extraTNotes, setTnotes } = useQuotesTranslation({
    book: '1ti',
    tnotes: [
      {
        Reference: '1:3',
        chapter: 1,
        verse: [3],
        Quote: 'προσμεῖναι ἐν Ἐφέσῳ',
        Occurrence: 1,
      },
    ],
    usfm: { link: 'ru_gl/ru_rlob' },
  });
  useEffect(() => {
    setData(JSON.stringify(extraTNotes, null, 2));
  }, [extraTNotes]);
  return <pre>{data}</pre>;
}

<Component />;
```

```jsx
import React, { useEffect, useState } from 'react';

import axios from 'axios';

import { useQuotesTranslation, formatLink, tsvToJSON } from '@texttree/tn-quote';

function Component() {
  const [data, setData] = useState('loading');
  const [line, setLine] = useState(5);
  const [linkInput, setLinkInput] = useState('unfoldingWord/en_ult');
  const [link, setLink] = useState('unfoldingWord/en_ult');
  const [tnUrl, setTnUrl] = useState(
    'https://git.door43.org/unfoldingWord/en_tn/raw/branch/master/tn_TIT.tsv'
  );

  const { extraTNotes, setTnotes } = useQuotesTranslation({
    book: 'tit',
    tnotes: [],
    usfm: { link },
  });

  useEffect(() => {
    setData(JSON.stringify(extraTNotes, null, 2));
  }, [extraTNotes]);

  const getData = async () => {
    const res = await axios.get(formatLink(tnUrl));
    const tsv = tsvToJSON(res.data, ['Reference', 'Quote', 'Note', 'Occurrence'], true);
    setTnotes([tsv[parseInt(line)]]);
  };

  return (
    <>
      <label>
        Link to target language
        <input
          value={linkInput}
          onBlur={() => setLink(linkInput)}
          onChange={(e) => setLinkInput(e.target.value)}
        />
      </label>
      <br />
      <label>
        Link to file with notes
        <input value={tnUrl} onChange={(e) => setTnUrl(e.target.value)} />
      </label>
      <br />
      <label>
        Line number from tsv
        <input value={line} onChange={(e) => setLine(e.target.value)} />
      </label>
      <br />
      <button onClick={getData}>GET</button>
      <hr />
      <pre style={{ border: '1px solid #777', background: '#eee' }}>{data}</pre>
    </>
  );
}

<Component />;
```
