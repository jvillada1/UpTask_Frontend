import api from "@/lib/axios"
import { isAxiosError } from "axios"
import type { UpdateCurrentPasswordForm, UserProfileForm } from "../types"

export async function updateProfile(formData: UserProfileForm){
    try {
        const {data} = await api.put('/auth/profile', formData)
        return data
    } catch (error) {
        if(isAxiosError(error) && error.response) 
            throw new Error(error.response.data.error) 
    }
} 

export async function changePassword(formData: UpdateCurrentPasswordForm){
    try {
        const {data} = await api.post('/auth/update-password', formData)
        return data
    } catch (error) {
        if(isAxiosError(error) && error.response) 
            throw new Error(error.response.data.error) 
    }
}