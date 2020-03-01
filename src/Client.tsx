import React, { useEffect, useState } from 'react';
import { BackendApi, TodoEntry, TodoList } from './types';
import { Command, CommandAction, Proxy } from 'flushout';

interface ClientProps {
    title: string;
    backendApi: BackendApi;
}

function TodoEntryView(props: {
    id: string;
    todo: TodoEntry;
    backendApi: BackendApi;
    applyCommand: (command: Command) => void;
}) {
    const [editingTodoId, setEditingTodoId] = useState<string>();
    const [editTodoField, setEditTodoField] = useState('');
    return <div key={props.id} style={{display: 'flex', alignItems: 'center', 
        borderWidth: '1px', backgroundColor: '#f6f6f6', borderStyle: 'solid', borderColor: '#cccccc',
        padding: 0, margin: '5px', marginLeft: '40px', marginRight: '40px'}}>
        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'stretch', flexGrow: 1, alignSelf: 'stretch'}}>
        <textarea name="todo-field" 
            style={{backgroundColor: 'inherit', border: 0}}
            rows={1}
            value={editingTodoId === props.id ? editTodoField : props.todo.text} 
            onChange={(ev) => { 
                setEditTodoField(ev.target.value);
            }} 
            onKeyPress={(ev) => {
                if (ev.which === 13) {
                    ev.preventDefault();
                    const updateCommand: Command<TodoEntry> = {
                        action: CommandAction.Update,
                        path: ['todos', props.id],
                        props: {
                            text: editTodoField
                        }
                    };
                    props.applyCommand(updateCommand);
                    ev.currentTarget.blur();
                }
            }}
            onBlur={() => {
                setEditingTodoId(undefined);
            }}
            onFocus={() => {
                setEditingTodoId(props.id);
                setEditTodoField(props.todo.text);
            }}/>
            <small style={{alignSelf: 'flex-start'}}>Created at {props.todo.createdAt ? new Date(props.todo.createdAt).toLocaleTimeString() : '<Not flushed>'}</small>
        </div>
        <button type="button" onClick={() => {
            const deleteCommand: Command = {
                action: CommandAction.Delete,
                path: ['todos', props.id]
            };
            props.applyCommand(deleteCommand);
        }}>Delete</button>
    </div>;
}

export function Client(props: ClientProps) {
    const [newTextField, setNewTextField] = useState('');
    const [localProxy, setLocalProxy] = useState<Proxy<TodoList>>();
    const [todoEntries, setTodoEntries] = useState<Array<[string, TodoEntry]>>([]);
    const [proxyCommandCount, setProxyCommandCount] = useState(0);
    const [lastSnapshotCommandCount, setLastSnapshotCommandCount] = useState(0);
    const [unflushedCommands, setUnflushedCommands] = useState(0);
    // Applies a command on the local proxy and updates the local count
    const applyLocally = (command: Command) => {
        if (localProxy) {
            localProxy.apply(command);
            setProxyCommandCount(localProxy.getCommandCount());
        }
    };
    // Get the initial snapshot from the master
    useEffect(() => {
        props.backendApi.latestSnapshot().then((todoList) => {
            const proxy = new Proxy(todoList);
            setLocalProxy(proxy);
            setProxyCommandCount(proxy.getCommandCount());
            setLastSnapshotCommandCount(todoList.commandCount);
        });
    }, []);
    // Drives UI updates
    useEffect(() => {
        if (localProxy) {
            setTodoEntries(Object.entries(localProxy.getDocument().todos).sort(([_id1, todo1], [_id2, todo2]) => {
                if (todo1.createdAt == undefined) {
                    return 1;
                }
                if (todo2.createdAt == undefined) {
                    return -1;
                }
                return todo1.createdAt - todo2.createdAt;
            }));
            setUnflushedCommands(localProxy.getCommandCount() - lastSnapshotCommandCount)
        }
    }, [proxyCommandCount, lastSnapshotCommandCount])
    return <div className="Client">
        <h1>{props.title}</h1>
        {localProxy == undefined ? 
        <p>Loading...</p> :
        <div style={{flexGrow: 1, alignSelf: 'stretch', display: 'flex', flexDirection: 'column', alignItems: 'stretch'}}>
            <div style={{flexGrow: 1, overflowY: 'scroll', height: '32vh'}}>
            {todoEntries.map(([id, todo]) => {
                return <TodoEntryView id={id} todo={todo} backendApi={props.backendApi} 
                    applyCommand={applyLocally}/>;
            })}
            </div>
            <div style={{alignSelf: 'stretch', display: 'flex', alignItems: 'center'}}>
                <textarea style={{flexGrow: 1}} value={newTextField} rows={1}
                    onChange={(ev) => { 
                        setNewTextField(ev.target.value); 
                    }}
                    placeholder='Enter some todo text...'/>
                <button type="button" onClick={() => {
                    const createCommand: Command<TodoEntry> = {
                        action: CommandAction.Create,
                        path: ['todos'],
                        props: {
                            text: newTextField
                        }
                    };
                    applyLocally(createCommand);
                    setNewTextField('');
                }}>New</button>
            </div>
            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-evenly', marginTop: '1em'}}>
                <span>Unflushed Commands: {unflushedCommands}</span> 
                <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                    <button type="button" onClick={() => {
                        const flush = localProxy.beginFlush();
                        props.backendApi.sendFlush(flush).then(async (result) => {
                            const flushResult = localProxy.endFlush(result.sync);
                            if (flushResult.idsChanged || flushResult.error != undefined) {
                                /* Simple handling of what should be extremely rare case when 
                                there's an error in what's returned from the backend, or when two clients 
                                create the same random ID at the same time */
                                console.log('Model re-initialized from backend, sync result was', result.sync);
                                const snapshot = await props.backendApi.latestSnapshot();
                                setLocalProxy(new Proxy(snapshot));
                            }
                            setLastSnapshotCommandCount(localProxy.getCommandCount());
                            setProxyCommandCount(localProxy.getCommandCount());                        
                        });
                    }}>Flush</button>
                    <small>(Synchronizes local commands with remote master)</small>
                </div>
            </div>
        </div>
        }
    </div>;
}