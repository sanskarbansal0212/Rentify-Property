import React, { useEffect, useRef, useState } from 'react';
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from 'react-redux';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { app } from '../firebase';
import { deleteUserFailure, deleteUserStart, deleteUserSuccess, signOutUserFailure, signOutUserStart, signOutUserSuccess, updateUserFailure, updateUserStart, updateUserSuccess } from '../Redux/User/UserSlice';

export default function Profile() {
    const fileRef = useRef(null);
    const { currentUser, loading, error } = useSelector(state => state.user);
    const [updateSuccess, setUpdateSuccess] = useState(false);
    const [file, setFile] = useState(undefined);
    const [formData, setFormData] = useState({});
    const [filePerc, setFilePerc] = useState(0);
    const [fileUploadError, setFileUploadError] = useState(false);
    const [showListingsError, setShowListingsError] = useState(false);
    const [userListings, setUserListings] = useState([])
    const dispatch = useDispatch();
    useEffect(() => {
        if (file) {
            handleFileUpload(file);
        }
    }, [file]);
    const handleFileUpload = () => {
        const storage = getStorage(app);
        const fileName = new Date().getTime() + file.name;
        const storageRef = ref(storage, fileName);
        const uploadTask = uploadBytesResumable(storageRef, file);
        uploadTask.on(
            'state_changed',
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                setFilePerc(Math.round(progress));
            },
            (error) => {
                setFileUploadError(true);
            },
            () => {
                getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) =>
                    setFormData({ ...formData, avatar: downloadURL })
                );
            }
        );
    }
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    }
    const handleSubmit = async (e) => {
        e.preventDefault();
        dispatch(updateUserStart())
        try {
            // const res = await fetch(`https://real-estate-bokm.onrender.com/api/user/update/${currentUser._id}`, {
            const res = await fetch(`https://real-estate-bokm.onrender.com/api/user/update/${currentUser._id}`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });
            const data = await res.json();
            if (data.message != undefined) {
                dispatch(updateUserFailure(data.message));
                return;
            }
            dispatch(updateUserSuccess(data));
            setUpdateSuccess(true);
        } catch (error) {
            dispatch(updateUserFailure(error.message));
            alert(error.message);
        }
    }
    const handleDeleteUser = async () => {
        try {
            dispatch(deleteUserStart);
            const res = await fetch(`https://real-estate-bokm.onrender.com/api/user/delete/${currentUser._id}`, {
                method: 'DELETE',
                credentials: 'include',
            })
            const data = await res.json();
            if (data.message != undefined) {
                dispatch(deleteUserFailure(data.message));
                return;
            }
            dispatch(deleteUserSuccess(data));
        } catch (error) {
            dispatch(deleteUserFailure(error.message));
            alert(error.message);
        }
    }
    const handleSignOut = async () => {
        try {
            dispatch(signOutUserStart());
            const res = await fetch('https://real-estate-bokm.onrender.com/api/auth/signout', {
                credentials: 'include',
            });
            const data = await res.json();
            if (data.message != undefined) {
                dispatch(signOutUserFailure(data.message));
                return;
            }
            dispatch(signOutUserSuccess(data));
        } catch (error) {
            dispatch(signOutUserFailure(data.message));
        }
    };

    const handleShowListings = async () => {
        try {
            setShowListingsError(false);
            const res = await fetch(`https://real-estate-bokm.onrender.com/api/user/listings/${currentUser._id}`, {
                credentials: 'include',
            });
            const data = await res.json();
            if (data.message != undefined) {
                setShowListingsError(true);
                return;
            }
            setUserListings(data);
        } catch (error) {
            setShowListingsError(true);
        }
    }

    const handleDeleteListing = async (listingId) => {
        try {
            const res = await fetch(`https://real-estate-bokm.onrender.com/api/listing/delete/${listingId}`, {
                method: "DELETE",
                credentials: 'include',
            });
            const data = await res.json();
            if (data.message != undefined) {
                console.log(data.message);
                return;
            }
            setUserListings((prev) => prev.filter((listing) => listing._id !== listingId));
        } catch (error) {
            console.log(error.message);
        }
    }

    return (
        <div className='p-3 max-w-lg mx-auto'>
            <h1 className='text-3xl font-semibold text-center my-7'>Profile</h1>
            <form onSubmit={handleSubmit} className='flex flex-col gap-4'>
                <input onChange={(e) => setFile(e.target.files[0])} type="file" ref={fileRef} hidden accept='image/' />
                <img onClick={() => fileRef.current.click()} src={formData.avatar || currentUser.avatar} alt='ProfileImage' className='rounded-full h-24 w-24 object-cover cursor-pointer self-center mt-2'></img>
                <p className='text-sm self-center'>
                    {fileUploadError ? (
                        <span className='text-red-700'>
                            Error Image upload (image must be less than 2 mb)
                        </span>
                    ) : filePerc > 0 && filePerc < 100 ? (
                        <span className='text-slate-700'>{`Uploading ${filePerc}%`}</span>
                    ) : filePerc === 100 ? (
                        <span className='text-green-700'>Image successfully uploaded!</span>
                    ) : (
                        ''
                    )}
                </p>
                <input onChange={handleChange} defaultValue={currentUser.username} type="text" id='username' placeholder='username' className='border p-3 rounded-lg' />
                <input onChange={handleChange} defaultValue={currentUser.email} type="email" id='email' placeholder='email' className='border p-3 rounded-lg' />
                <input onChange={handleChange} type="password" id='password' placeholder='password' className='border p-3 rounded-lg' />
                <button disabled={loading} className='text-white bg-slate-700 rounded-lg p-3 uppercase hover:opacity-95 disabled:opacity-80'>
                    {loading ? "Loading... " : "Update"}
                </button>
                <Link className='bg-green-700 text-white p-3 rounded-lg uppercase text-center hover:opacity-70' to={"/create-listing"}>Create Listing</Link>
            </form>
            <div className='flex justify-between mt-5'>
                <span onClick={handleDeleteUser} className='text-red-700 cursor-pointer'>Delete Account</span>
                <span onClick={handleSignOut} className='text-red-700 cursor-pointer'>Signout</span>
            </div>
            <p className='text-red-700 mt-5'>{error ? error : ""}</p>
            <p className='text-green-700 mt-5'>{updateSuccess ? "User is updated successfully." : ""}</p>
            <button className='text-green-700 w-full' onClick={handleShowListings}>Show listings</button>
            <p className='text-red-700 mt-5'>{showListingsError ? "Error showing listings" : ""}</p>
            {userListings && userListings.length > 0 &&
                <div className='flex flex-col gap-4'>
                    <h1 className='text-center mt-7 text-2xl font-semibold'>Your Listings</h1>
                    {userListings.map((listing) => (
                        <div key={listing._id} className='flex border rounded-lg p-3 justify-between items-center gap-4'>
                            <Link to={`/listing/${listing._id}`}>
                                <img className='h-16 w-16 object-contain ' src={listing.imageUrls[0]} alt="listingCover" />
                            </Link>
                            <Link className='text-slate-700 font-semibold hover:underline truncate flex-1' to={`/listing/${listing._id}`}>
                                <p>{listing.name}</p>
                            </Link>
                            <div className='flex flex-col items-center'>
                                <button onClick={() => handleDeleteListing(listing._id)} className='text-red-700 uppercase'>Delete</button>
                                <Link to={`/update-listing/${listing._id}`}>
                                    <button className='text-green-700 uppercase'>Edit</button>
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            }
        </div>
    )
}
