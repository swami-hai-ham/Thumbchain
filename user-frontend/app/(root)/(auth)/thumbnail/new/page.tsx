import SideNav from '@/components/SideNav'
import UploadImage from '@/components/UploadImage'
import React from 'react'


type Props = {}

const Page = (props: Props) => {
  return (
    <div className='relative flex h-full w-full justify-start items-center flex-col border-border border-l-2'>
      <UploadImage />
    </div>
  )
}

export default Page