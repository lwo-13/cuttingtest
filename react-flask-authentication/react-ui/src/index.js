// Set webpack public path dynamically BEFORE any imports
/* eslint-disable no-undef */
if (typeof window !== 'undefined' && window.location.pathname.startsWith('/web_forward_CuttingApplicationAPI')) {
  __webpack_public_path__ = '/web_forward_CuttingApplicationAPI/';
} else {
  __webpack_public_path__ = '/';
}
/* eslint-enable no-undef */

/* eslint-disable import/first */
import React from 'react';
import ReactDOM from 'react-dom';
import './i18n';

// third party
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';

// project imports
import { store, persister } from './store';
import * as serviceWorker from './serviceWorker';
import App from './App';
import config from './config';

// style + assets
import './assets/scss/style.scss';
/* eslint-enable import/first */

//-----------------------|| REACT DOM RENDER  ||-----------------------//

ReactDOM.render(
    <Provider store={store}>
        <PersistGate loading={null} persistor={persister}>
            <BrowserRouter basename={config.basename}>
                <App />
            </BrowserRouter>
        </PersistGate>
    </Provider>,
    document.getElementById('root')
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
