<template>
  <div class="hello">
    <h1>{{ msg }}</h1>
    <h3>Demos</h3>
    <ul>
      <li><a href="javascript:void(0);" @click="$router.push('/demo-1')" rel="noopener">Demo 1</a></li>
    </ul>
  </div>
</template>

<script>
export default {
  name: 'HelloWorld',
  data () {
    return {
      msg: 'Play Canvas in Vue.js'
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
h3 {
  margin: 40px 0 0;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
}
</style>
