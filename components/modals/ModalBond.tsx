import React, {useState} from 'react';
import Input from 'components/Input';
import TokenDropdown from 'components/TokenDropdown';
import {useKeep3r} from 'contexts/useKeep3r';
import {ethers} from 'ethers';
import {activate} from 'utils/actions/activate';
import {approveERC20} from 'utils/actions/approveToken';
import {bond} from 'utils/actions/bond';
import {getEnv} from 'utils/env';
import {Button, Modal} from '@yearn-finance/web-lib/components';
import {useWeb3} from '@yearn-finance/web-lib/contexts';
import {Cross} from '@yearn-finance/web-lib/icons';
import {defaultTxStatus, format, Transaction} from '@yearn-finance/web-lib/utils';

import type {ReactElement} from 'react';

type		TModalBond = {
	chainID: number,
	tokenBonded: string,
	isOpen: boolean,
	onClose: () => void
}
function	ModalBond({isOpen, onClose, tokenBonded, chainID}: TModalBond): ReactElement {
	const	{provider, isActive} = useWeb3();
	const	{keeperStatus, getKeeperStatus} = useKeep3r();
	const	[amount, set_amount] = useState('');
	const	[txStatusBond, set_txStatusBond] = useState(defaultTxStatus);
	const	[txStatusApprove, set_txStatusApprove] = useState(defaultTxStatus);
	const	[txStatusActivate, set_txStatusActivate] = useState(defaultTxStatus);

	async function	onBond(): Promise<void> {
		if (!isActive || txStatusBond.pending || keeperStatus.hasDispute) {
			return;
		}
		const	transaction = (
			new Transaction(provider, bond, set_txStatusBond).populate(
				chainID,
				tokenBonded,
				format.toSafeAmount(amount, keeperStatus.balanceOf)
			).onSuccess(async (): Promise<void> => {
				await getKeeperStatus();
			})
		);

		const	isSuccessful = await transaction.perform();
		if (isSuccessful) {
			set_amount('');
		}
	}

	async function	onApprove(): Promise<void> {
		if (!isActive || txStatusApprove.pending || keeperStatus.hasDispute) {
			return;
		}
		const	transaction = (
			new Transaction(provider, approveERC20, set_txStatusApprove).populate(
				tokenBonded,
				getEnv(chainID).KEEP3R_V2_ADDR,
				format.toSafeAmount(amount, keeperStatus.balanceOf)
			).onSuccess(async (): Promise<void> => {
				await getKeeperStatus();
			})
		);

		await transaction.perform();
	}
	
	async function	onActivate(): Promise<void> {
		if (!isActive || txStatusActivate.pending || keeperStatus.hasDispute) {
			return;
		}
		const	transaction = (
			new Transaction(provider, activate, set_txStatusActivate).populate(
				chainID,
				tokenBonded
			).onSuccess(async (): Promise<void> => {
				await getKeeperStatus();
			})
		);

		const	isSuccessful = await transaction.perform();
		if (isSuccessful) {
			set_amount('');
		}
	}

	function		bondButton(): ReactElement {
		const	allowance = ethers.utils.formatUnits(keeperStatus.allowance, 18);
		if (Number(allowance) < Number(amount)) {
			return (
				<Button
					onClick={onApprove}
					isBusy={txStatusApprove.pending}
					isDisabled={
						!isActive ||
						keeperStatus.hasDispute ||
						Number(amount) > format.toNormalizedValue(keeperStatus?.balanceOf || ethers.constants.Zero, 18)
					}>
					{txStatusApprove.error ? 'Transaction failed' : txStatusApprove.success ? 'Transaction successful' : 'Approve'}
				</Button>
			);
		}
	
		return (
			<Button
				onClick={onBond}
				isBusy={txStatusBond.pending}
				isDisabled={
					!isActive ||
					keeperStatus.hasDispute ||
					Number(amount) > format.toNormalizedValue(keeperStatus?.balanceOf || ethers.constants.Zero, 18)
				}>
				{txStatusBond.error ? 'Transaction failed' : txStatusBond.success ? 'Transaction successful' : 'Bond'}
			</Button>
		);
	}

	return (
		<Modal
			isOpen={isOpen}
			onClose={onClose}>
			<div className={'space-y-4 p-6'}>
				<div className={'mb-4 flex items-center justify-between'}>
					<h2 className={'text-xl font-bold'}>{'Bond'}</h2>
					<Cross className={'h-6 w-6 cursor-pointer text-black'} onClick={onClose} />
				</div>
				
				<div className={'mb-4 grid grid-cols-1 gap-4 md:grid-cols-2'}>
					<div className={'space-y-6'}>
						<p>
							{'To become a keeper, you simply need to call '}
							<code className={'text-grey-2 inline'}>{'bond(address,uint)'}</code>
							{'. No funds are required to become a keeper, however, certain jobs might require a minimum amount of funds.'}
						</p>
						<p>
							{'There is a bond time (default 3-day) delay before you can become an active keeper. Once this delay has passed, you will have to call '}
							<code className={'text-grey-2 inline'}>{'activate()'}</code>
							{'.'}
						</p>
					</div>
					<div className={'space-y-10 bg-white p-6'}>
						<div>
							<p className={'mb-2'}>{'Balance, KP3R'}</p>
							<b className={'text-xl'}>{format.toNormalizedAmount(keeperStatus.balanceOf, 18)}</b>
						</div>
						<div>
							<p className={'mb-2'}>{'Pending, KP3R'}</p>
							<b className={'text-xl'}>{format.toNormalizedAmount(keeperStatus.pendingBonds, 18)}</b>
						</div>
						<div>
							<p className={'mb-2'}>{'Bonded, KP3R'}</p>
							<b className={'text-xl'}>{format.toNormalizedAmount(keeperStatus.bonds, 18)}</b>
						</div>
					</div>
				</div>

				<div className={'mb-4 grid grid-cols-2 gap-4'}>
					<div className={'mb-4 space-y-2'}>
						<b>{'Token'}</b>
						<TokenDropdown.Fake name={'KP3R'} />
					</div>
					<div className={'space-y-2'}>
						<b>{'Amount'}</b>
						<div>
							<Input.BigNumber
								value={amount}
								onSetValue={(s: string): void => set_amount(s)}
								maxValue={keeperStatus?.balanceOf || ethers.constants.Zero}
								decimals={18}
								canBeZero
								shouldHideBalance/>
						</div>
					</div>
				</div>

				<div className={'mb-4 grid grid-cols-2 gap-4'}>
					<div>
						{bondButton()}
					</div>
					<div>
						<Button
							onClick={onActivate}
							isBusy={txStatusActivate.pending}
							isDisabled={!keeperStatus.canActivate}>
							{
								txStatusActivate.error ? 'Transaction failed' :
									txStatusActivate.success ? 'Transaction successful' :
										keeperStatus.hasPendingActivation ? 
											keeperStatus.canActivate || keeperStatus.canActivateIn === 'Now' ? 'Activate' : `Activate (${keeperStatus.canActivateIn})`
											: 'Activate'
							}
						</Button>
					</div>
				</div>
			</div>
		</Modal>
	);
}

export {ModalBond};