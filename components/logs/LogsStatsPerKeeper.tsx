/* eslint-disable @typescript-eslint/no-explicit-any */
import React, {useEffect, useMemo, useState} from 'react';
import {usePagination, useSortBy, useTable} from 'react-table';
import Link from 'next/link';
import IconChevronFilled from 'components/icons/IconChevronFilled';
import IconLoader from 'components/icons/IconLoader';
import {getEnv} from 'utils/env';
import axios from 'axios';
import {Chevron} from '@yearn-finance/web-lib/icons';
import {format, performBatchedUpdates} from '@yearn-finance/web-lib/utils';
import {truncateHex} from '@yearn-finance/web-lib/utils/address';

import type {ReactElement, ReactNode} from 'react';

type		TWorkLogs = {
	keeper: string,
	earnedUnit: string,
	earned: string,
	fees: string,
	gwei: string,
	workDone: number
}
type		TLogs = {searchTerm: string, chainID: number}

function	LogsStatsPerKeeper({searchTerm, chainID}: TLogs): ReactElement {
	const	[isInit, set_isInit] = useState(false);
	const	[logs, set_logs] = useState<TWorkLogs[]>([]);

	useEffect((): void => {
		axios.get(`${getEnv(chainID, false).BACKEND_URI}/works/keepers`)
			.then((_logs): void => {
				performBatchedUpdates((): void => {
					set_logs(_logs.data || []);
					set_isInit(true);
				});
			})
			.catch((): void => set_isInit(true));
	}, [chainID]);

	const data = useMemo((): unknown[] => (
		logs
			.filter((log): boolean => log.keeper?.includes(searchTerm))
			.map((log): unknown => ({
				address: log.keeper,
				earnedKp3r: Number(log.earnedUnit),
				earnedUsd: Number(log.earned),
				fees: Number(log.fees),
				netEarned: Number(log.earned) - Number(log.fees),
				calls: log.workDone,
				kp3rPerCall: Number(log.earned) / log.workDone,
				gweiPerCall: Number(log.gwei) / log.workDone
			}))
	), [logs, searchTerm]);
		
	const columns = useMemo((): unknown[] => [
		{Header: 'Keeper', accessor: 'address', className: 'pr-8', Cell: ({value}: {value: string}): ReactNode => truncateHex(value, 5)},
		{
			Header: 'Earned, KP3R',
			accessor: 'earnedKp3r',
			className: 'cell-end pr-8',
			sortType: 'basic',
			Cell: ({value}: {value: number}): ReactNode => format.amount(value, 2, 2)
		},
		{
			Header: 'Earned, $',
			accessor: 'earnedUsd',
			className: 'cell-end pr-8',
			sortType: 'basic',
			Cell: ({value}: {value: number}): ReactNode => format.amount(value, 2, 2)
		},
		{
			Header: 'TX fees, $',
			accessor: 'fees',
			className: 'cell-end pr-8',
			sortType: 'basic',
			Cell: ({value}: {value: number}): ReactNode => format.amount(value, 2, 2)
		},
		{
			Header: 'Net earned, $',
			accessor: 'netEarned',
			className: 'cell-end pr-8',
			sortType: 'basic',
			Cell: ({value}: {value: number}): ReactNode => format.amount(value, 2, 2)
		},
		{
			Header: 'Calls',
			accessor: 'calls',
			className: 'cell-end pr-8',
			sortType: 'basic',
			Cell: ({value}: {value: number}): ReactNode => format.amount(value, 0, 0)
		},
		{
			Header: 'KP3R per call ',
			accessor: 'kp3rPerCall',
			className: 'cell-end pr-8',
			sortType: 'basic',
			Cell: ({value}: {value: number}): ReactNode => format.amount(value, 2, 2)
		},
		{
			Header: 'GWEI per call',
			accessor: 'gweiPerCall',
			className: 'cell-end',
			sortType: 'basic',
			Cell: ({value}: {value: number}): ReactNode => format.amount(value, 2, 2)
		}
	], []);

	const {
		getTableProps,
		getTableBodyProps,
		headerGroups,
		prepareRow,
		page, //with pagination
		canPreviousPage,
		canNextPage,
		pageOptions,
		nextPage,
		previousPage,
		state: {pageIndex}
	} = useTable({columns, data, initialState: {pageSize: 50}}, useSortBy, usePagination);
	
	function	renderPreviousChevron(): ReactElement {
		if (!canPreviousPage) {
			return (<Chevron className={'h-4 w-4 cursor-not-allowed opacity-50'} />);
		}
		return (
			<Chevron
				className={'h-4 w-4 cursor-pointer'}
				onClick={previousPage} />
		);
	}

	function	renderNextChevron(): ReactElement {
		if (!canNextPage) {
			return (<Chevron className={'h-4 w-4 rotate-180 cursor-not-allowed opacity-50'} />);
		}
		return (
			<Chevron
				className={'h-4 w-4 rotate-180 cursor-pointer'}
				onClick={nextPage} />
		);
	}

	if (!isInit && logs.length === 0) {
		return (
			<div className={'flex h-full min-h-[112px] items-center justify-center'}>
				<IconLoader className={'h-6 w-6 animate-spin'} />
			</div>
		);
	}

	return (
		<div className={'flex w-full flex-col overflow-x-scroll'}>
			<table
				{...getTableProps()}
				className={'min-w-full overflow-x-scroll'}>
				<thead>
					{headerGroups.map((headerGroup: any): ReactElement => (
						<tr key={headerGroup.getHeaderGroupProps().key} {...headerGroup.getHeaderGroupProps()}>
							{headerGroup.headers.map((column: any): ReactElement => (
								<th
									key={column.getHeaderProps().key}
									{...column.getHeaderProps(column.getSortByToggleProps([
										{
											className: 'pt-2 pb-8 text-left text-base font-bold whitespace-pre'
										}
									]))}>
									<div className={`flex flex-row items-center ${column.className}`}>
										{column.render('Header')}
										{column.canSort ? (
											<div className={'ml-1'}>
												{column.isSorted
													? column.isSortedDesc
														? <IconChevronFilled className={'h-4 w-4 cursor-pointer text-neutral-500'} />
														: <IconChevronFilled className={'h-4 w-4 rotate-180 cursor-pointer text-neutral-500'} />
													: <IconChevronFilled className={'h-4 w-4 cursor-pointer text-neutral-300 transition-colors hover:text-neutral-500'} />}
											</div>
										) : null}
									</div>
								</th>
							))}
						</tr>
					))}
				</thead>
				<tbody {...getTableBodyProps()}>
					{page.map((row: any): ReactElement => {
						prepareRow(row);
						return (
							<Link key={row.getRowProps().key} href={`/stats/${chainID}/${row.values.address}`}>
								<tr {...row.getRowProps()} className={'cursor-pointer transition-colors hover:bg-white'}>
									{row.cells.map((cell: any): ReactElement => {
										return (
											<td
												key={cell.getCellProps().key}
												{...cell.getCellProps([
													{
														className: `pt-2 pb-6 text-base font-mono whitespace-pre ${cell.column.className}`,
														style: cell.column.style
													}
												])
												}>
												{cell.render('Cell')}
											</td>
										);
									})}
								</tr>
							</Link>
						);
					})}
				</tbody>
			</table>
			{canPreviousPage || canNextPage ? (
				<div className={'flex flex-row items-center justify-end space-x-2 p-4'}>
					{renderPreviousChevron()}
					<p className={'select-none text-sm tabular-nums'}>
						{`${pageIndex + 1}/${pageOptions.length}`}
					</p>
					{renderNextChevron()}
				</div>
			) : null}
		</div>
	);
}

export default LogsStatsPerKeeper;
