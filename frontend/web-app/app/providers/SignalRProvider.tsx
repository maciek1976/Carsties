'use client'

import { useAuctionStore } from '@/hooks/useAuctionStore';
import { useBidStore } from '@/hooks/useBidStore';
import { Auction, AuctionFinished, Bid } from '@/types';
import { HubConnection, HubConnectionBuilder } from '@microsoft/signalr'
import { User } from 'next-auth';
import React, { ReactNode, useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'react-hot-toast';
import AuctionCreatedToast from '../components/AuctionCreatedToast';
import { getDetailedViewData } from '../actions/auctionActions';
import AuctionFinishedToast from '../components/AuctionFinishedToast';
import { useParams } from 'next/navigation';

type Props = {
    children: ReactNode
    user: User | null
}

export default function SignalRProvider({ children, user }: Props) {
    //const [connection, setConnection] = useState<HubConnection | null>(null);
    const connection = useRef<HubConnection | null>(null);
    const setCurrentPrice = useAuctionStore(state => state.setCurrentPrice);
    const addBid = useBidStore(state => state.addBid);
    const params = useParams();
    const apiUrl = 'http://localhost:6001/notifications';
    // const apiUrl = process.env.NODE_ENV === 'production' 
    //     ? 'https://api.carsties.store/notifications'
    //     : process.env.NEXT_PUBLIC_NOTIFY_URL

    const handleAuctionFinished = useCallback((finishedAuction: AuctionFinished) => {
        const auction = getDetailedViewData(finishedAuction.auctionId);
        return toast.promise(auction, {
            loading: 'Loading',
            success: (auction) => 
                <AuctionFinishedToast 
                    auction={auction} 
                    finishedAuction={finishedAuction}
                />,
            error: (err) => 'Auction finished'
        }, {success: {duration: 10000, icon: null}});
    }, []);
    
    const handleAuctionCreated = useCallback((auction: Auction) => {
        if (user?.username !== auction.seller) {
            return toast(<AuctionCreatedToast auction={auction}/>, {
                duration: 10000
            });
        }
    }, [user?.username]);
    
    const handleBidPlaced = useCallback((bid: Bid) => {
        if (bid.bidStatus.includes('Accepted')) {
            setCurrentPrice(bid.auctionId, bid.amount);
        }

        if (params.id === bid.auctionId) {
            addBid(bid);
        }
    }, [setCurrentPrice, addBid, params.id]);

    useEffect(() => {
        if (!connection.current) {
            connection.current = new HubConnectionBuilder()
                .withUrl(apiUrl)
                .withAutomaticReconnect()
                .build();
        
            connection.current.start()
                .then(() => 'Connected to notification hub')
                .catch(err => console.log(err));
        }
        // const newConnection = new HubConnectionBuilder()
        //     .withUrl(apiUrl)
        //     .withAutomaticReconnect()
        //     .build();

        //setConnection(newConnection);

        

        connection.current.on('BidPlaced', handleBidPlaced);
        connection.current.on('AuctionCreated', handleAuctionCreated);
        connection.current.on('AuctionFinished', handleAuctionFinished);

        return () => {
            connection.current?.off('BidPlaced', handleBidPlaced);
            connection.current?.off('AuctionCreated', handleAuctionCreated);
            connection.current?.off('AuctionFinished', handleAuctionFinished);
        }
    }, [setCurrentPrice, handleBidPlaced, handleAuctionCreated, handleAuctionFinished]);

    // useEffect(() => {
    //     if (connection) {
    //         connection.start()
    //             .then(() => {
    //                 console.log('Connected to notification hub');

    //                 connection.on('BidPlaced', (bid: Bid) => {
    //                     if (bid.bidStatus.includes('Accepted')) {
    //                         setCurrentPrice(bid.auctionId, bid.amount);
    //                     }
    //                     addBid(bid);
    //                 });

    //                 connection.on('AuctionCreated', (auction: Auction) => {
    //                     if (user?.username !== auction.seller) {
    //                         return toast(<AuctionCreatedToast auction={auction} />, 
    //                             {duration: 10000})
    //                     }
    //                 });

    //                 connection.on('AuctionFinished', (finishedAuction: AuctionFinished) => {
    //                     const auction = getDetailedViewData(finishedAuction.auctionId);
    //                     return toast.promise(auction, {
    //                         loading: 'Loading',
    //                         success: (auction) => 
    //                             <AuctionFinishedToast 
    //                                 finishedAuction={finishedAuction} 
    //                                 auction={auction}
    //                             />,
    //                         error: (err) => 'Auction finished!'
    //                     }, {success: {duration: 10000, icon: null}})
    //                 })


    //             }).catch(error => console.log(error));
    //     }

    //     return () => {
    //         connection?.stop();
    //     }
    // }, [connection, setCurrentPrice, addBid, user?.username])

    return (
        children
    )
}