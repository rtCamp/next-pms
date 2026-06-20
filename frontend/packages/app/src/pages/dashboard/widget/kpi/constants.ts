/**
 * Internal dependencies.
 */
import { currencyFormat } from "@/lib/utils";

const usdFormat = currencyFormat("USD");

export const formatUsd = (value: number) => usdFormat.format(value);
export const formatPercent = (value: number) => `${Math.round(value)}%`;
