/**
 * External dependencies.
 */
import { configureStore } from "@reduxjs/toolkit";
import { useDispatch, useSelector } from "react-redux";

/**
 * Internal dependencies.
 */

import projectReducer from "./project";
import userReducer from "./user";
import viewReducer from "./view";

export const store = configureStore({
	reducer: {
		user: userReducer,
		project: projectReducer,
		view: viewReducer,
	},
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export type AppStore = typeof store;

export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
