import React, {useMemo, useState} from 'react';
import Line from 'components/Line';
import {ModalBond} from 'components/modals/ModalBond';
import {ModalUnbond} from 'components/modals/ModalUnbond';
import TokenDropdown from 'components/TokenDropdown';
import {useKeep3r} from 'contexts/useKeep3r';
import {getEnv} from 'utils/env';
import {Button} from '@yearn-finance/web-lib/components';
import {format} from '@yearn-finance/web-lib/utils';
import {toAddress} from '@yearn-finance/web-lib/utils/address';

import type {ReactElement} from 'react';

function	SectionKeepersWanted({chainID}: {chainID: number}): ReactElement {
	const	{keeperStatus} = useKeep3r();
	const	selectedToken = useMemo((): string => toAddress(getEnv(chainID).KP3R_TOKEN_ADDR), [chainID]);
	const	[isModalBondOpen, set_isModalBondOpen] = useState(false);
	const	[isModalUnBondOpen, set_isModalUnBondOpen] = useState(false);

	return (
		<section aria-label={'KEEPERS WANTED'}>
			<h2 className={'text-xl font-bold'}>{'KEEPERS WANTED'}</h2>
			<div className={'mt-4 mb-6'}>
				<p>{'Join '}<a className={'underline'} href={'#'}>{'keep3r.network'}</a>{' as a keeper, help running decentralized infrastructures and get paid for this. '}</p>
			</div>

			<TokenDropdown.Fake name={'KP3R'} />

			<div className={'my-4'}>
				<dl className={'w-full space-y-4'}>
					<div className={'relative flex w-full flex-row items-center justify-between overflow-hidden'}>
						<dt className={'bg-grey-5 whitespace-nowrap pr-2'}>{'Balance'}</dt>
						<dd className={'w-full font-bold'}>
							<div className={'absolute bottom-1.5 -z-10 w-full'}>
								<Line />
							</div>
							<div className={'flex justify-end'}>
								<p className={'bg-grey-5 pl-1 text-right'}>
									{`${format.BN(keeperStatus?.balanceOf).isZero() ? '0.000000' : format.toNormalizedAmount(keeperStatus?.balanceOf, 18)} KP3R`}
								</p>
							</div>
						</dd>
					</div>

					<div className={'relative flex w-full flex-row items-center justify-between overflow-hidden'}>
						<dt className={'bg-grey-5 whitespace-nowrap pr-2'}>{'Bonds'}</dt>
						<dd className={'w-full font-bold'}>
							<div className={'absolute bottom-1.5 -z-10 w-full'}>
								<Line />
							</div>
							<div className={'flex justify-end'}>
								<p className={'bg-grey-5 pl-1 text-right'}>
									{`${format.BN(keeperStatus?.bonds).isZero() ? '0.000000' : format.toNormalizedAmount(keeperStatus.bonds, 18)} KP3R`}
								</p>
							</div>
						</dd>
					</div>

					<div className={'relative flex w-full flex-row items-center justify-between overflow-hidden'}>
						<dt className={'bg-grey-5 whitespace-nowrap pr-2'}>{'Work Completed'}</dt>
						<dd className={'w-full font-bold'}>
							<div className={'absolute bottom-1.5 -z-10 w-full'}>
								<Line />
							</div>
							<div className={'flex justify-end'}>
								<p className={'bg-grey-5 pl-1 text-right'}>{'0'}</p>
							</div>
						</dd>
					</div>
				</dl>
			</div>

			<div className={'mb-10'}>
				<div className={'grid w-full grid-cols-2 gap-2'}>
					<Button onClick={(): void => set_isModalBondOpen(true)}>{'Bond'}</Button>
					<Button onClick={(): void => set_isModalUnBondOpen(true)}>{'Unbond'}</Button>
				</div>
			</div>
			<ModalBond
				chainID={chainID}
				isOpen={isModalBondOpen}
				onClose={(): void => set_isModalBondOpen(false)}
				tokenBonded={selectedToken} />
			<ModalUnbond
				chainID={chainID}
				isOpen={isModalUnBondOpen}
				onClose={(): void => set_isModalUnBondOpen(false)}
				tokenBonded={selectedToken} />
		</section>
	);
}

export default SectionKeepersWanted;
