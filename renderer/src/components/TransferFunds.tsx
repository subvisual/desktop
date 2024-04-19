import { FC } from 'react'
import InfoIcon from 'src/assets/img/icons/info.svg?react'
import { FilecoinNumber, BigNumber } from '@glif/filecoin-number'

interface TransferFundsButtonsProps {
  transferMode: boolean;
  balance: string | undefined;
  enableTransferMode: () => void;
  transferAllFunds: () => void;
  reset: () => void;
  destinationFilAddress: string | undefined;
  editMode: boolean;
  hasCurrentTransaction: boolean;
}

const TransferFundsButtons: FC<TransferFundsButtonsProps> = ({
  transferMode,
  balance,
  enableTransferMode,
  transferAllFunds,
  reset,
  destinationFilAddress,
  editMode,
  hasCurrentTransaction
}) => {
  const disabled = !destinationFilAddress ||
    hasCurrentTransaction ||
    Number(balance) <= 0.01
  return (
    <div
      className={`
        relative flex items-end w-full ease-[cubic-bezier(0.85,0,0.15,1)] duration-500
        ${(!editMode) ? 'visible' : 'z-0 -translate-y-[7.8rem] text-opacity-0 opacity-0'}
        ${(editMode && disabled) && 'invisible opacity-0'}
      `}
    >
      <div
        className={`
          absolute w-fit right-0 flex items-center ease-[cubic-bezier(0.85,0,0.15,1) duration-500 z-10
          ${(transferMode && !disabled) ? '-translate-x-[8rem] opacity-0' : ''}
        `}
      >
        <button
          className="wallet-transfer-start btn-primary w-40 bg-grayscale-250 border-0"
          disabled={disabled}
          onClick={enableTransferMode}
        >
          <span
            className={`text-2xs px-4 text-body-s ${disabled ? 'text-white text-opacity-80' : 'text-primary'}`}
          >
            Transfer FIL
          </span>
        </button>
        {disabled && !hasCurrentTransaction &&
          <div
            className={`
              wallet-transfer-tooltip absolute -left-[13px] mb-[1px] hover:-left-[89px] hover:-top-[87.5px] flex
              flex-col items-center group
            `}
          >
            <div className='w-44 px-2 py-4 mb-[13px] rounded-lg bg-grayscale-200 hidden group-hover:block'>
              <p className='text-body-2xs text-center'>
                We need a FIL address and positive balance to transfer your FIL
              </p>
            </div>
            <InfoIcon className="fill-grayscale-400" width={'24px'} height={'24px'} />
          </div>
        }
      </div>
      <div
        className={`absolute w-full justify-end right-0 flex gap-1 items-center ${transferMode ? 'z-20' : 'z-0'} `}
      >
        <button
          className={`
            wallet-transfer-confirm btn-primary w-fit min-w-[160px] bg-grayscale-250 text-primary border-0
            ease-[cubic-bezier(0.85,0,0.15,1) duration-500
            ${transferMode ? '' : 'translate-x-[7.6rem] text-opacity-0 opacity-0'}
          `}
          onClick={transferAllFunds}
        >
          <span className="text-2xs px-4 text-body-s">
            Send{' '}
            <span className='font-bold'>
              {new FilecoinNumber(String(balance), 'fil')
                .decimalPlaces(3, BigNumber.ROUND_DOWN)
                .toString()}
              {' '}FIL
            </span>
          </span>
        </button>
        <button
          className={`
            wallet-transfer-cancel btn-primary ease-[cubic-bezier(0.85,0,0.15,1) duration-500
              ${transferMode ? '' : 'opacity-0'}
          `}
          onClick={reset}
        >
            <span className="text-2xs px-4 text-body-s">Cancel</span>
        </button>
      </div>
    </div>
  )
}

export default TransferFundsButtons
