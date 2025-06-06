/*
 *      Sign-In With Wallet 
 */

import {replyFast, checkIsValidDomain, checkIsValidStatement, checkIsValidChain, checkIsValidDate, generateNonce}  from './siww_utils'

const CONNECTOR_SYMBOL = "SIWW"       // must override by class

export class siww_connect {

//
//      helpers
//

    createDefaultWallet(_idWallet) {
        return {
            chain: null,
            connector: this.getConnectorSymbol(),
            id: _idWallet,
            api: null,
            apiVersion: null,
            name: null,
            logo: null,
            isEnabled: false,
            isOnProd: false,
            hasReplied: false,
            networkId: 0,
            address: null
        }
    }

    getConnectorSymbol() {return CONNECTOR_SYMBOL}

    getUnknownChainInfo(_networkId) {
        return {
            connector: CONNECTOR_SYMBOL,
            name: null,
            symbol: null,
            id: _networkId? _networkId: 0,
            image : "symbol_unknown.png"        // sorry, hardcoded
        }
    }

    getChainInfoFromSymbol(_symbol) {
        let _aChain=this.getAcceptedChains();
        let _iChain=_aChain.findIndex(function (x) {return x.symbol===_symbol});
        return (_iChain>=0? _aChain[_iChain] : this.getUnknownChainInfo())
    }

    getSanitizedWallet(_objWallet) {
        return {
            connector: _objWallet.connector,
            chain: _objWallet.chain,
            networkId: _objWallet.networkId,
            id: _objWallet.id,
            name: (_objWallet.name? _objWallet.name.charAt(0).toUpperCase() + _objWallet.name.slice(1): null),     // capitalise wallet id
            isEnabled: _objWallet.isEnabled,
            isOnProd: _objWallet.isOnProd,
            hasReplied: _objWallet.hasReplied,
            logo: _objWallet.logo,
            address: _objWallet.address
        }        
    }

    getWalletFromList(_idWallet) {
        let i=this.aWallet.findIndex(function (x) {return x.id===_idWallet});
        return (i===-1? null : {
            index: i,
            wallet: this.aWallet[i]
        })
    }

    // must overwrite on implementation class
    getAcceptedChains() {
        return [];
    }

    getConnectorSymbol() {
        return CONNECTOR_SYMBOL;
    }

//
//      Initialization
//

    async async_initialize(objParam) {

        // various init params
        this.msKillFast = (objParam && objParam.msKillFast? objParam.msKillFast : 3000);
        this.msKillSlow = (objParam && objParam.msKillSlow? objParam.msKillSlow : 8000);

        // get all callbacks
        this.fnOnNotifyAccessibleWallets=objParam.onNotifyAccessibleWallets;
        this.fnOnNotifyConnectedWallet=objParam.onNotifyConnectedWallet;
        this.fnOnNotifySignedMessage=objParam.onNotifySignedMessage;

        // array of all accessible wallets
        this.aWallet=[];
        let that=this;
        try {
            // first call to get list of wallets (no calls to them)
            that.aWallet=await that.async_onListAccessibleWallets(false);

            // notify caller of all those available wallets we have detected
            if(this.fnOnNotifyAccessibleWallets) {
                this.fnOnNotifyAccessibleWallets(that.aWallet);
            }

            // notify caller of each connected wallet 
            that.aWallet.forEach(async function(item) {
                if(item.isEnabled) {
                    try {
                        let objRetConnected=await replyFast(that.msKillSlow, that.async_getConnectedWalletExtendedInfo.bind(that), item.id);
                        if(objRetConnected.isEnabled && objRetConnected.address && that.fnOnNotifyConnectedWallet) {
                            that.fnOnNotifyConnectedWallet({
                                didUserAccept: true,
                                didUserClick: false,
                                didShowWallet: true,
                                error: null,
                                wallet: that.getSanitizedWallet(objRetConnected)
                            });
                        }        
                    }
                    catch(error) { 
                        // we don t callback for this...
                        console.log(error);
                    }
                }
            });            
        }
        catch(err){
            throw err;
        }
    }

//
//      Generic APIs
//

    // get default wallet info (from browser)
    async async_getDefaultWalletInfo(_idWallet) {
        try {
            if(_idWallet) {

                let objWallet=this.createDefaultWallet(_idWallet);

                // enable?
                try {
                    let _isEnabled=await replyFast(this.msKillFast, this.async_isWalletEnabled.bind(this), _idWallet);
                    objWallet.isEnabled=_isEnabled;
                    objWallet.hasReplied=true;
                }
                catch(_err) {
                    objWallet.hasReplied=false;
                    // ok to fail... send basic info anyway
                }
                return this.getSanitizedWallet(objWallet);
            }
            else {
                throw new Error("Bad params");
            }
        }
        catch(err) {
            throw err;
        }
    }

    // request user to validate wallet connection
    async async_connectWallet(_idWallet) {
        let _obj=this.getWalletFromList(_idWallet);
        let _objWallet=this.createDefaultWallet(_idWallet);
        try{
            if (_obj && _obj.wallet) {                
                _objWallet=_obj.wallet;

                // ask to connect (wait for user to click on wallet OK )
                _objWallet.api = await this.async_enableWallet(_objWallet.id);
                if (_objWallet.api) {

                    // get connection details
                    let _obj=await this.async_getConnectedWalletExtendedInfo(_idWallet);
                    let objRet={
                        didUserAccept: true,
                        didUserClick: true,
                        didShowWallet: true,
                        error: null,
                        wallet: this.getSanitizedWallet(_obj)
                    }

                    if(this.fnOnNotifyConnectedWallet) {
                        this.fnOnNotifyConnectedWallet(objRet);
                    }
                    return objRet;
                } else {

                    _objWallet.isEnabled=false;
                    _objWallet.hasReplied=true;

                    let objRet2={
                        didUserAccept: false,
                        didUserClick: true,
                        didShowWallet: true,
                        error: "Wallet connection refused by user",
                        wallet: this.getSanitizedWallet(_objWallet)
                }
                    if(this.fnOnNotifyConnectedWallet) {
                        this.fnOnNotifyConnectedWallet(objRet2);
                    }
                        return objRet2;
                }
            } else {
                throw new Error("expected a wallet id, got null");
            }
        } catch (err) {
            let _err=err.message? err.message : err;
            _objWallet.isEnabled=false;
            _objWallet.hasReplied=false;
            return {
                didUserAccept: false,
                didUserClick: false,
                didShowWallet: false,
                error : "Could not connect to wallet ("+_err+")",
                wallet: this.getSanitizedWallet(_objWallet)
            };
        }
    }        

    async async_checkWallet(_idWallet) {
        let _obj=this.getWalletFromList(_idWallet);
        let _objWallet=this.createDefaultWallet(_idWallet);
        try{
            if (_obj && _obj.wallet) {                
                _objWallet=_obj.wallet;

                // ask to connect (wait for user to click on wallet OK )
                _objWallet.api = await this.async_enableWallet(_objWallet.id);
                if (_objWallet.api) {
                    let _addr=await this._async_getFirstAddress(_objWallet.api);
                    const _assets=await this._async_getWalletAssetsFromAddress(_addr);
                    return {
                        didUserAccept: true,
                        didUserClick: true,
                        didShowWallet: true,
                        error: null,
                        wallet: this.getSanitizedWallet(_objWallet),
                        address: _addr,
                        assets: _assets
                    }
                }
            }
        } catch (err) {
            let _err=err.message? err.message : err;
            _objWallet.isEnabled=false;
            _objWallet.hasReplied=false;
            return {
                didUserAccept: false,
                didUserClick: false,
                didShowWallet: false,
                error : "Could not connect to wallet ("+_err+")",
                wallet: this.getSanitizedWallet(_objWallet)
            };
        }
    }

//
//      All APIs to code (in implementation class)
//

    async async_onListAccessibleWallets() {
        return [];
    }

    async async_enableWallet(idWallet) {
        return null;
    }

    async async_isWalletEnabled(idWallet) {
        return false;
    }

//
//      Common implementation
//

    async async_getConnectedWalletExtendedInfo(_id){
        let _objWallet=null;
        try {
            _objWallet=this.getWalletFromList(_id);
            if(!_objWallet)  {
                throw new Error("Could not find wallet "+_id);
            }

            // are we enabled?
            _objWallet=_objWallet.wallet;
            if(!_objWallet.api && _objWallet.id!==null) {
                _objWallet.api = await this.async_enableWallet(_objWallet.id);
            }

            if(!_objWallet.api) {
                throw new Error("Bad params");
            }

            let _networkId = await _objWallet.api.getNetworkId();
            let _aChain=this.getAcceptedChains();
            let iChain=_aChain.findIndex(function (x) {return x.id===_networkId});
            _objWallet.networkId = _networkId;
            _objWallet.isOnProd=this.getChainIDs()[_networkId]!==null;
            _objWallet.address=await this._async_getFirstAddress(_objWallet.api);
            _objWallet.chain= iChain>=0 ? _aChain[iChain] : this.getUnknownChainInfo(_networkId) ;
            _objWallet.isEnabled=true;
            return _objWallet;
        }
        catch(err) {
            if(_objWallet) {_objWallet.isEnabled=false;}
            return _objWallet;
        }
    }

//
//      Messages 
//

    // An input message must have all those params:
    //
    //  domain: string ; dns authority that is requesting the signing
    //  address: string ; address performing the signing 
    //  message: string ; message statement that the user will sign
    //  version: string ; version of the message
    //  chain: string ; chain that is being queried
    //  name: string ; name of wallet being queried
    //  issued_at: date ; when this message was issued
    //  valid_for: number ; how many seconds the message is valid (after issued_at)
    //  nonce: number ; randomized number used to prevent replay attacks
    //
    isMessageInputValid(objParam){
        if(!checkIsValidDomain(objParam.domain)) {return false;}
        if(!objParam.address) {return false;}
        if(!checkIsValidStatement(objParam.message)) {return false;}
        if(!checkIsValidChain(objParam.chain, this.getAcceptedChains())) {return false;}
        if(!checkIsValidDate(objParam.issued_at, objParam.valid_for)) {return false;}
        return true;
    }

    async async_createMessage(_idWallet, objParam){
        try{

            // are we connected with a wallet?
            let _obj=this.getWalletFromList(_idWallet);
            if (_obj && _obj.wallet) {                
                let _objWallet=_obj.wallet;

                // who is caling?
                let _host=window.location.hostname;
                if(window.location.port!=="") {
                    _host=_host+":"+window.location.port;
                }

                let now = new Date(); 
                let nowUtc = new Date(now.getTime() + now.getTimezoneOffset() * 60000);
        
                // full object filled with wallet info
                let objMsg={
                    message: objParam.message? objParam.message: null,
                    domain: _host,
                    issued_at: nowUtc,
                    valid_for: objParam.valid_for? objParam.valid_for : null,
                    address: _objWallet.address,
                    chain: _objWallet.chain.name,
                    name: _objWallet.name,
                    api: _objWallet.api,
                    version: objParam.version? objParam.version: "1.0",
                    nonce: generateNonce()
                }

                // disconnected wallet?
                if(!objMsg.api) {
                    throw new Error("Wallet connection not found - have you removed it?");
                }

                if(!objMsg.address) {
                    throw new Error("Wallet address not found - have you disconnected wallet?");
                }

                if(!_objWallet.chain.name) {
                    throw new Error("unsupported blockchain - please connect with another chain");
                }
              
                if(!this.isMessageInputValid(objMsg)) {
                    throw new Error("missing or incorrect params");
                }
                    
                // message is OK to go
                return objMsg;
            }
            else {
                throw new Error("expected a wallet id, got null");
            }
        } catch (err) {
            throw err;
        }
    }

    getMessageAsText(objSiwcMsg, type) {
        let aMsg=[];
        aMsg.push( objSiwcMsg.message);
        aMsg.push( "");
        aMsg.push( "-- Secure message by Sign With Wallet --");
        aMsg.push( "Purpose: "+ type);
//        aMsg.push( "Issued At: "+ objSiwcMsg.issued_at);
        aMsg.push( "Valid for: "+ objSiwcMsg.valid_for/60 + " minutes");
        aMsg.push( "Cost: 0.00");
//        aMsg.push( "Version: "+ objSiwcMsg.version);
        let msg=aMsg.join("\r\n");
        return msg;
    }

    // type of signing:
    //  "authentication" : for authenticating user
    //  "revocation" : for revocating consent of data shared by user with domain
    //

    // Sign a message (blockchain specific, implement on top class)
    async async_signMessageOnly(objSiwcMsg, type, address){
        try {
            if(address!==objSiwcMsg.address) {
                throw new Error("Public address does not match");
            }
    
            let msg=this.getMessageAsText(objSiwcMsg, type);
            let _hex= Buffer.from(msg).toString('hex');
            return {
                msg: msg,
                buffer: _hex,
                key: null,
                signature: null
            }    
        }
        catch(err) {
            throw err;
        }
    }

    // Sign a message
    async async_signMessage(_idWallet, objSiwcMsg, type){
        try {
            // we make sure the weallet is enabled...
            this.async_enableWallet();

            let COSESign1Message=null;

            // get key and signature            
            COSESign1Message = await this.async_signMessageOnly(objSiwcMsg, type, null);

            // notify?
            if(this.fnOnNotifySignedMessage) {
                this.fnOnNotifySignedMessage(COSESign1Message);
            }

            // add info for server side validation
            COSESign1Message.valid_for=objSiwcMsg.valid_for;
            COSESign1Message.issued_at=objSiwcMsg.issued_at;
            COSESign1Message.address=objSiwcMsg.address;
            COSESign1Message.chain=objSiwcMsg.chain;
            COSESign1Message.connector=this.getConnectorSymbol();
            COSESign1Message.type=type;
            return COSESign1Message;

        }
        catch(err) {
            console.log (err);
            throw err;
        }
    }
    
    // format a message for showing in wallet
    _formatMessage(objMsg) {
        let _strValidFor=null;
        if(objMsg.valid_for<60) {_strValidFor=objMsg.valid_for+" seconds"} else {
            if(objMsg.valid_for<3600) {_strValidFor=Math.floor(objMsg.valid_for/60)+" minutes"} else {
                _strValidFor=Math.floor(objMsg.valid_for/3600)+" hours"
            }
        }
        let _str=objMsg.message + "\n\nissued at "+objMsg.issued_at.toString()+" and valid for "+_strValidFor;
        return _str;
    }
}

export default siww_connect;