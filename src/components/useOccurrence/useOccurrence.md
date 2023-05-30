# New Testament

```jsx
import React, { useEffect, useState } from 'react';

import { useOccurrence } from '@texttree/tn-quote';

function Component() {
  const [data, setData] = useState('loading');
  const res = useOccurrence({
    book: 'jhn',
    chapter: 1,
    verses: [1],
    quotes: [{ quote: 'λόγος', occurrence: 2 }], // καὶ & ὁ
  });
  useEffect(() => {
    setData(JSON.stringify(res));
  }, [res]);
  return <>{data}</>;
}

<Component />;
```

```jsx
import React, { useEffect, useState } from 'react';

import { useOccurrence } from '@texttree/tn-quote';

function Component() {
  const [data, setData] = useState('loading');
  const res = useOccurrence({
    book: '1ti',
    chapter: 1,
    verses: [3, 4],
    quotes: [{ quote: 'προσμεῖναι ἐν Ἐφέσῳ', occurrence: 1 }],
  });
  useEffect(() => {
    setData(JSON.stringify(res));
  }, [res]);
  return <>{data}</>;
}

<Component />;
```
