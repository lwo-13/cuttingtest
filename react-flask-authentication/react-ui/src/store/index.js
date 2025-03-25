import { createStore, applyMiddleware } from 'redux';
import { persistStore } from 'redux-persist';
import thunk from 'redux-thunk';  // ✅ Import thunk
import reducer from './reducer';

//-----------------------|| REDUX - MAIN STORE ||-----------------------//

const store = createStore(
    reducer,
    applyMiddleware(thunk)  // ✅ Add thunk middleware here
);

const persister = persistStore(store);

export { store, persister };