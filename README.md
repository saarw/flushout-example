# A collaborative todo-list application using Flushout
Try the demo in your browser here: https://eager-almeida-2b573e.netlify.com/   
   
Example of a Todo-list app that uses distributed data model Flushout to support collaboration between multiple clients.   

The application runs completely in the browser and requires manual flushing by pressing a button to demonstrate how local changes get synchronized with the master model. Real applications would trigger flushes whenever the local proxy gets updated, on a timer, and/or on signals from the backend that the master model has been updated.