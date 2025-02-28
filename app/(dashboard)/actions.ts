'use server';

import {
  createEvent,
  deleteEventById,
  updateEvent,
  deleteProductById
} from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export async function addEvent(formData: FormData) {
  const session = await auth();
  if (!session?.user?.email) {
    throw new Error('You must be logged in to add an event');
  }

  const name = formData.get('name') as string;
  const dateStr = formData.get('date') as string;

  if (!name || !dateStr) {
    throw new Error('Name and date are required');
  }

  const date = new Date(dateStr);

  await createEvent(session.user.email, name, date);
  revalidatePath('/');
  redirect('/');
}

export async function deleteEvent(formData: FormData) {
  const session = await auth();
  if (!session?.user?.email) {
    throw new Error('You must be logged in to delete an event');
  }

  const id = Number(formData.get('id'));

  await deleteEventById(id);
  revalidatePath('/');
}

export async function deleteProduct(formData: FormData) {
  const session = await auth();
  if (!session?.user?.email) {
    throw new Error('You must be logged in to delete a product');
  }

  const id = Number(formData.get('id'));

  await deleteProductById(id);
  revalidatePath('/products');
}

export async function editEvent(formData: FormData) {
  const session = await auth();
  if (!session?.user?.email) {
    throw new Error('You must be logged in to edit an event');
  }

  const id = Number(formData.get('id'));
  const name = formData.get('name') as string;
  const dateStr = formData.get('date') as string;

  if (!name || !dateStr) {
    throw new Error('Name and date are required');
  }

  const date = new Date(dateStr);

  await updateEvent(id, name, date);
  revalidatePath('/');
  redirect('/');
}
