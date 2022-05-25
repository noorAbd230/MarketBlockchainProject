const Shoppingplace = artifacts.require("./Shoppingplace.sol");

require('chai')
  .use(require('chai-as-promised'))
  .should()

contract('Shoppingplace', ([deployer,seller,buyer]) => {
    let shoppingplace
    before(async () => {
      shoppingplace = await Shoppingplace.deployed()
    })

        describe('deployment', async () => {
            it('deploys successfully', async () => {
                const address = await shoppingplace.address
                assert.notEqual(address,0x0)
                assert.notEqual(address,'')
                assert.notEqual(address,null)
                assert.notEqual(address,undefined)
            })

          it('has a name', async () => {
              const name = await shoppingplace.name()
              assert.notEqual(name,'My Market')
          })

    })


      describe('products', async () => {
        let result , productCount;
        before(async () => {
          result = await shoppingplace.createProduct('iPhone X',web3.utils.toWei('1','Ether'), { from: seller })
          productCount = await shoppingplace.productCount()
        })

      it('creates Product', async () => {
        // SUCCESS
          assert.equal(productCount,1)
          const event = result.logs[0].args
          assert.equal(event.id.toNumber(), productCount.toNumber(), 'id is correct')
          assert.equal(event.name, 'iPhone X', 'name is correct')
          assert.equal(event.price, web3.utils.toWei('1','Ether'), 'price is correct')
          assert.equal(event.owner, seller, 'owner is correct')
          assert.equal(event.purchased, false, 'purchased is correct')

          // FAILURE : Product must have a name
        await shoppingplace.createProduct('', web3.utils.toWei('1','Ether'), { from: seller }).should.be.rejected

        // FAILURE : Product must have a price
        await shoppingplace.createProduct('iPhone X', 0, { from: seller }).should.be.rejected
      })

      it('list Products', async () => {
        const product = await shoppingplace.products(productCount)
        assert.equal(product.id.toNumber(), productCount.toNumber(), 'id is correct')
          assert.equal(product.name, 'iPhone X', 'name is correct')
          assert.equal(product.price, web3.utils.toWei('1','Ether'), 'price is correct')
          assert.equal(product.owner, seller, 'owner is correct')
          assert.equal(product.purchased, false, 'purchased is correct')
      })

      it('sell Products', async () => {
        //Track the seller balance before purchase
        let oldSellerBalance
        oldSellerBalance = await web3.eth.getBalance(seller)
        oldSellerBalance = new web3.utils.BN(oldSellerBalance)
        //Success
        result = await shoppingplace.purchaseProduct(productCount,{from : buyer, value: web3.utils.toWei('1','Ether')})
        //Check logs
        const event = result.logs[0].args
          assert.equal(event.id.toNumber(), productCount.toNumber(), 'id is correct')
          assert.equal(event.name, 'iPhone X', 'name is correct')
          assert.equal(event.price, web3.utils.toWei('1','Ether'), 'price is correct')
          assert.equal(event.owner, buyer, 'owner is correct')
          assert.equal(event.purchased, true, 'purchased is correct')

          //Check that seller received funds
          let newSellerBalance
          newSellerBalance = await web3.eth.getBalance(seller)
          newSellerBalance = new web3.utils.BN(newSellerBalance)

          let price
          price = web3.utils.toWei('1','Ether')
          price = new web3.utils.BN(price)

          const expectedBalance = oldSellerBalance.add(price)
          assert.equal(expectedBalance.toString(),newSellerBalance.toString())

          // FAILURE: Tries to buy a product that does not exist
          await shoppingplace.purchaseProduct(99, { from: buyer, value: web3.utils.toWei('1', 'Ether')}).should.be.rejected;
          // FAILURE: Buyer tries to buy without enough Ether
          await shoppingplace.purchaseProduct(productCount, { from: buyer, value: web3.utils.toWei('0.5', 'Ether')}).should.be.rejected;
          // FAILURE: Deployer tries to buy the product
          await shoppingplace.purchaseProduct(productCount, { from: deployer, value: web3.utils.toWei('1', 'Ether')}).should.be.rejected;
          // FAILURE: Buyer tries to buy again
          await shoppingplace.purchaseProduct(productCount, { from: buyer, value: web3.utils.toWei('1', 'Ether')}).should.be.rejected;

      })

      })
 
})
