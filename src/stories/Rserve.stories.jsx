import React from 'react';

import { Rserve, useRserve } from '../components/Rserve';

const MyApp = () => {
  const { R, connecting } = useRserve();
  const [v, setV] = React.useState('');

  React.useEffect(() => {
    if (!R || !R.running) {
      setV('');
      return;
    };
    R.ocap((err, funs) => {
      funs.rversion((err, value) => setV(value));
    });
  }, [R, setV]);

  return <>
    Demo app with R {v !== '' ? v + ' running' : 'not running'}
    {connecting ? ' (connecting ...)' : ''}
  </>;
};

export default {
  title: 'Rserve',
  component: Rserve
}

const Template = (args) => <Rserve {...args}><MyApp /></Rserve>

export const Local = Template.bind({})
Local.args = { host: 'ws://localhost:8081' }
