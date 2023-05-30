# useSelection

## New Testament

```jsx
import React, { useEffect, useState } from 'react';

import { useSelection, tsvToJSON, verseObjectsToString } from '@texttree/tn-quote';
import { toJSON } from 'usfm-js';
import axios from 'axios';

function Component() {
  const [greek, setGreek] = useState();
  const [target, setTarget] = useState();
  const [tn, setTn] = useState();
  useEffect(() => {
    // 1TI
    const getData = async () => {
      const { data: greekRaw } = await axios.get(
        'https://git.door43.org/unfoldingWord/el-x-koine_ugnt/raw/branch/master/55-1TI.usfm'
      );
      const greek = toJSON(greekRaw).chapters;
      setGreek(greek);
      const { data: tnRaw } = await axios.get(
        'https://git.door43.org/ru_gl/ru_tn/raw/branch/master/tn_1TI.tsv'
      );
      const tn = tsvToJSON(tnRaw);
      setTn(tn);
      const { data: targetRaw } = await axios.get(
        'https://git.door43.org/ru_gl/ru_rlob/raw/branch/master/55-1TI.usfm'
      );
      const target = toJSON(targetRaw).chapters;
      setTarget(target);
    };
    getData();
  }, []);
  let data = 'loading';
  let selectedTn = '';
  if (greek && target && tn) {
    selectedTn = tn[11];
    data = useSelection({
      greekVerseObjects: greek[selectedTn.chapter][selectedTn.verse].verseObjects,
      targetVerseObjects: target[selectedTn.chapter][selectedTn.verse].verseObjects,
      quote: selectedTn.quote,
      occurrence: selectedTn.occurrence,
      chapter: 1,
      verses: [3],
    });
  }
  return (
    <>
      {selectedTn
        ? selectedTn.chapter + ':' + selectedTn.verse + ' ' + selectedTn.quote
        : ''}{' '}
      - {data}
    </>
  );
}

<Component />;
```

## Old Testament

```js
import React, { useEffect, useState } from 'react';

import { useSelection, tsvToJSON } from '@texttree/tn-quote';
import { toJSON } from 'usfm-js';
import axios from 'axios';

function Component() {
  const [greek, setGreek] = useState();
  const [target, setTarget] = useState();
  const [tn, setTn] = useState();
  useEffect(() => {
    // 1TI
    const getData = async () => {
      const { data: greekRaw } = await axios.get(
        'https://git.door43.org/unfoldingWord/hbo_uhb/raw/branch/master/15-EZR.usfm'
      );
      const greek = toJSON(greekRaw).chapters;
      setGreek(greek);
      const { data: tnRaw } = await axios.get(
        'https://git.door43.org/ru_gl/ru_tn/raw/branch/master/tn_EZR.tsv'
      );
      const tn = tsvToJSON(tnRaw);
      setTn(tn);
      const { data: targetRaw } = await axios.get(
        'https://git.door43.org/ru_gl/ru_rlob/raw/branch/master/15-EZR.usfm'
      );
      const target = toJSON(targetRaw).chapters;
      setTarget(target);
    };
    getData();
  }, []);
  let data = 'loading';
  let selectedTn = '';
  if (greek && target && tn) {
    selectedTn = tn[45];
    data = useSelection({
      greekVerseObjects: greek[selectedTn.chapter][selectedTn.verse].verseObjects,
      targetVerseObjects: target[selectedTn.chapter][selectedTn.verse].verseObjects,
      quote: selectedTn.quote,
      occurrence: selectedTn.occurrence,
      chapter: 1,
      verses: [8],
    });
  }
  return (
    <>
      {selectedTn
        ? selectedTn.chapter + ':' + selectedTn.verse + ' ' + selectedTn.quote
        : ''}{' '}
      - {data}
    </>
  );
}

<Component />;
```
