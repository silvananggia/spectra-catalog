// ** Reducers Imports
import { combineReducers } from '@reduxjs/toolkit';
import stacCatalog from './slices/stacCatalog';

const rootReducer = combineReducers({
  stacCatalog,
});

export default rootReducer;

