import React, { useState, useEffect } from 'react';
import { Proxy, CommandAction, Command } from 'flushout';
import { BackendApi, TodoList, TodoEntry } from './types';

interface ClientProps {
    title: string;
    backendApi: BackendApi;
}

export function Client(props: ClientProps) {
    const [newTextField, setNewTextField] = useState('');
    const [flushoutProxy, setFlushoutProxy] = useState<Proxy<TodoList>>();
    const [todoEntries, setTodoEntries] = useState<Array<[string, TodoEntry]>>([]);
    const [proxyCommandCount, setProxyCommandCount] = useState(0);
    const [lastSnapshotCommandCount, setLastSnapshotCommandCount] = useState(0);
    const [unflushedCommands, setUnflushedCommands] = useState(0);
    const [editingTodoId, setEditingTodoId] = useState<string>();
    const [editTodoField, setEditTodoField] = useState('');
    useEffect(() => {
        props.backendApi.latestSnapshot().then((todoList) => {
            const proxy = new Proxy(todoList);
            setFlushoutProxy(proxy);
            setProxyCommandCount(proxy.getCommandCount());
            setLastSnapshotCommandCount(todoList.commandCount);
        });
    }, []);
    // Effect drives UI updates
    useEffect(() => {
        if (flushoutProxy) {
            setTodoEntries(Object.entries(flushoutProxy.getDocument().todos));
            setUnflushedCommands(flushoutProxy.getCommandCount() - lastSnapshotCommandCount)
        }
    }, [proxyCommandCount, lastSnapshotCommandCount])
    return <div className="Client">
        <h1>{props.title}</h1>
        {flushoutProxy == undefined ? 
        <p>Loading...</p> :
        <div style={{flexGrow: 1, alignSelf: 'stretch', display: 'flex', flexDirection: 'column', alignItems: 'stretch'}}>
            <div style={{flexGrow: 1}}>
            {todoEntries.map(([id, todo]) => {
                return <div key={id} style={{display: 'flex', alignItems: 'center', 
                    borderWidth: '1px', borderStyle: 'solid', borderColor: '#cccccc',
                    padding: 0, margin: '5px', marginLeft: '40px', marginRight: '40px'}}>
                        <textarea name="todo-field" style={{flexGrow: 1, borderWidth: 0, alignSelf: 'stretch'}}
                        value={editingTodoId === id ? editTodoField : todo.text} 
                        onChange={(ev) => { 
                            setEditTodoField(ev.target.value);
                        }} 
                        onKeyPress={(ev) => {
                            if (ev.which === 13) {
                                ev.preventDefault();
                                const updateCommand: Command<TodoEntry> = {
                                    action: CommandAction.Update,
                                    path: ['todos', id],
                                    props: {
                                        text: editTodoField
                                    }
                                };
                                flushoutProxy.apply(updateCommand);
                                setProxyCommandCount(flushoutProxy.getCommandCount());
                                ev.currentTarget.blur();
                            }
                        }}
                        onBlur={() => {
                            setEditingTodoId(undefined);
                        }}
                        onFocus={() => {
                            setEditingTodoId(id);
                            setEditTodoField(todo.text);
                        }}/>
                        <button type="button" onClick={() => {
                            const deleteCommand: Command = {
                                action: CommandAction.Delete,
                                path: ['todos', id]
                            };
                            flushoutProxy.apply(deleteCommand);
                            setProxyCommandCount(flushoutProxy.getCommandCount());
                        }}>Delete</button>
                    </div>;
            })}
            </div>
            <div style={{alignSelf: 'stretch', display: 'flex', alignItems: 'center'}}>
                <textarea style={{flexGrow: 1}} value={newTextField} 
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
                    flushoutProxy.apply(createCommand);
                    setNewTextField('');
                    setProxyCommandCount(flushoutProxy.getCommandCount());
                }}>New</button>
            </div>
            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-evenly', marginTop: '1em'}}>
                <span>Unflushed Commands: {unflushedCommands}</span> 
                <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                    <button type="button" onClick={() => {
                        const flush = flushoutProxy.beginFlush();
                        props.backendApi.sendFlush(flush).then(async (result) => {
                            console.log(result);
                            const flushResult = flushoutProxy.endFlush(result.sync);
                            console.log(flushResult);
                            if (flushResult.idsChanged || flushResult.error != undefined) {
                                /* Rough handling of what should be extremely rare case when 
                                there's an error or when two clients create the same random ID at the same time */
                                console.log('Model re-initialized from backend, sync result was', result.sync);
                                const snapshot = await props.backendApi.latestSnapshot();
                                setFlushoutProxy(new Proxy(snapshot));
                            }
                            setLastSnapshotCommandCount(flushoutProxy.getCommandCount());
                            setProxyCommandCount(flushoutProxy.getCommandCount());                        
                        });
                    }}>Flush</button>
                    <small>(Synchronizes local commands with remote master)</small>
                </div>
            </div>
        </div>
        }
    </div>;
}