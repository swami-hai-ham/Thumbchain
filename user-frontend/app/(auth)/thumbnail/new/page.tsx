import SideNav from '@/components/SideNav'
import UploadImage from '@/components/UploadImage'
import React from 'react'


type Props = {}

const page = (props: Props) => {
  return (
    <div className='flex justify-start items-center w-full h-screen flex-col'>
      <h3 className='text-3xl text-foreground font-poppins font-bold m-6'>Upload More than 1 Thumbnail</h3>
      <UploadImage />
    </div>
  )
}

export default page