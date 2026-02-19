
import React, { createContext, useState, useEffect, useContext } from 'react';

const DataContext = createContext();

export const DataProvider = ({ children }) => {
    const [clients, setClients] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [version, setVersion] = useState(0); // Simple counter to trigger refreshes

    const refreshData = () => {
        setVersion(v => v + 1);
    };

    useEffect(() => {
        setLoading(true);
        Promise.all([
            fetch('http://localhost:3001/api/clients').then(res => res.json()),
            fetch('http://localhost:3001/api/products').then(res => res.json())
        ]).then(([clientsData, productsData]) => {
            setClients(clientsData.clients || []);
            setProducts(productsData.products || []);
            setLoading(false);
        }).catch(err => {
            console.error("Failed to load global data", err);
            setLoading(false);
        });
    }, [version]);

    return (
        <DataContext.Provider value={{ clients, products, loading, refreshData, version }}>
            {children}
        </DataContext.Provider>
    );
};

export const useData = () => useContext(DataContext);
