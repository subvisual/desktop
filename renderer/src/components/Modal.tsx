import { FC } from 'react'
import WalletModule from 'src/components/WalletModule'

interface ModalProps {
  isOpen: boolean;
  setIsOpen: () => void;
}
const Modal : FC<ModalProps> = ({ isOpen, setIsOpen }) => {
  return (
    <>
    <div
      className={`
        modal-bg fixed h-full w-full bg-primary duration-700 ease-[cubic-bezier(0.45,0,0.55,1)]
        ${isOpen ? 'z-30 opacity-20 visible' : 'opacity-0 z-[25] invisible'}
      `}
      onClick={setIsOpen}
    />
    <div
      className={`
        modal-content fixed z-30  w-[744px] h-full bg-white duration-700 ease-[cubic-bezier(0.45,0,0.55,1)]
        ${isOpen ? 'right-0' : '-right-[744px] invisible'}
      `}
    >
      <WalletModule isOpen={isOpen} />
    </div>
    </>
  )
}

export default Modal
