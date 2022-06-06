import React from 'react'
import { Container, Row, Col, Button, Dropdown, DropdownButton, ButtonGroup } from 'react-bootstrap'

import { Flow } from "../components/Layout"
import { shortenAccount, getAccount } from "../web3/utils"
import { myWeb3 } from "../web3/provider"
import { getBalance as getBalancePoolLP, getAllowance as getAllowancePoolLP } from "../web3/pool_lp"
import { getBalance as getBalanceUSDC, getAllowance as getAllowanceUSDC } from "../web3/usdc"


export default class Header extends React.Component {

    constructor(props) {
        super(props);
        this.state = {}
        this.handleAccount = this.handleAccount.bind(this);
    }

    componentDidMount() {
        this.reload()

        ethereum.on('chainChanged', (chainId) => {
            // Handle the new chain.
            // Correctly handling chain changes can be complicated.
            // We recommend reloading the page unless you have good reason not to.
            console.log("chainId changed:", chainId)

            window.location.reload();
        });
    }

    reloadPressed = async () => {
        this.reload()
        this.props.reload()  // reaload parent page
    }

    reload = async () => {
        await this.loadBlockInfo()
        await this.loadAccount()
        await this.loadBalance()
    }


    connect = () => {
        ethereum.request({ method: 'eth_requestAccounts' }).then(accounts => {
            let account = accounts.length > 0? accounts[0] : undefined
            if (account) {
                this.reload()
                this.handleAccount(account)
            } else {
                console.log(">>> connect() - account ", account)
            }
        })
    }

    handleAccount = (account) => {
        if (account) {
            this.setState({
                account: shortenAccount(account),
            })
            this.props.setAccountConnected(true)
        } else {
            this.setState({
                account: undefined,
            })
            this.props.setAccountConnected(false)
        }
    }


    loadAccount = () => {
        getAccount().then((account) => {
            this.handleAccount(account)
        }).catch(error => {
            this.setState({ error: error.message })
            this.props.setAccountConnected(false)
        })
    }

    loadBalance = () => {
        getBalanceUSDC().then(data => {
            this.setState({
                balanceUSDC: data.units
            })
            return getBalancePoolLP()
        }).then(data => {
            this.setState({
                balancePoolLP: data.units
            })
        }).catch(error => {
            this.setState({ error: error.message })
        })
    }


    loadBlockInfo = () => {
        myWeb3.eth.net.getId().then( id => {
            console.log("NETWORK ID", id)
        })
        myWeb3.eth.getBlockNumber().then( number => {
            return myWeb3.eth.getBlock(number)
        }).then((block) => {
            this.setState({
                blockNumber: block.number,
                blockTimestamp: block.timestamp
            })
        }).catch((error) => {
            this.setState({ error: error.message })
        })
    }


    render() {

        const { balanceUSDC, balancePoolLP } = this.state

        const blockNumber = this.state && this.state.blockNumber
        const blockDate = this.state && this.state.blockTimestamp && new Date(this.state.blockTimestamp * 1000)
        const blockDateFormatted = (blockDate && `${blockDate.toLocaleDateString()} @ ${blockDate.toLocaleTimeString()}`) || "-"
        const account = this.state && this.state.account

        return (
            <div className="header">
                <Container fluid>
                    <Row>
                        <Col>
                            <Flow>
                                <div>
                                { (balanceUSDC !== undefined) && <h5 className="m-2"> {balanceUSDC} USDC</h5> }
                                </div>
                                <div>
                                { (balancePoolLP !== undefined) && <h5 className="m-2"> {balancePoolLP} Pool-LP </h5> }
                                </div>
                            </Flow>
                        </Col>

                        <Col xs className="text-end">
                            {(account &&
                                <DropdownButton
                                    id="menu"
                                    variant="outline-primary"
                                    title={account}
                                >
                                    <Dropdown.Item eventKey="1" disabled >Block Info</Dropdown.Item>
                                    <Dropdown.Divider />
                                    <Dropdown.Item eventKey="2" disabled >number: {blockNumber} </Dropdown.Item>
                                    <Dropdown.Item eventKey="3" disabled >date: {blockDateFormatted}</Dropdown.Item>
                                    <Dropdown.Divider />
                                    <Dropdown.Item eventKey="4" onClick={() => this.reloadPressed()}>Reload</Dropdown.Item>
                                </DropdownButton>
                            ) || <Button name="connect" variant="primary" onClick={() => this.connect()} >Connect Wallet</Button>}
                        </Col>
                    </Row>
                </Container>

            </div>
        )
    }
}